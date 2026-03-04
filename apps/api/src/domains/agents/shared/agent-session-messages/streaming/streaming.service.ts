import { URL } from "node:url"
import type { MessageEvent } from "@nestjs/common"
import { Inject, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { FilePart, ImagePart } from "ai"
import type { Repository } from "typeorm/repository/Repository"
import { v4 } from "uuid"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type {
  LLMChatMessage,
  LLMMetadata,
  LLMProvider,
} from "@/common/interfaces/llm-provider.interface"
import type { Agent } from "@/domains/agents/agent.entity"
import { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import { FormAgentSession } from "@/domains/agents/form-agent-sessions/form-agent-session.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentsService } from "@/domains/documents/documents.service"
import {
  FILE_STORAGE_SERVICE,
  type IFileStorage,
} from "@/domains/documents/storage/file-storage.interface"
import { ServiceWithLLM } from "@/external/llm"
import { AgentMessage } from "../agent-message.entity"

@Injectable()
export class StreamingService extends ServiceWithLLM {
  private readonly STREAM_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
  private readonly agentMessageRepository: Repository<AgentMessage>
  private readonly agentMessageConnectRepository: ConnectRepository<AgentMessage>
  private readonly conversationAgentSessionRepository: Repository<ConversationAgentSession>
  private readonly formAgentSessionRepository: Repository<FormAgentSession>

  constructor(
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorage,
    private readonly documentsService: DocumentsService,

    @InjectRepository(ConversationAgentSession)
    conversationAgentSessionRepository: Repository<ConversationAgentSession>,

    @InjectRepository(FormAgentSession)
    formAgentSessionRepository: Repository<FormAgentSession>,

    @InjectRepository(AgentMessage)
    agentMessageRepository: Repository<AgentMessage>,

    @Inject("_MockLLMProvider")
    mockLlmProvider: LLMProvider,
    @Inject("VertexLLMProvider")
    vertexLlmProvider: LLMProvider,
  ) {
    super(mockLlmProvider, vertexLlmProvider)

    this.conversationAgentSessionRepository = conversationAgentSessionRepository

    this.formAgentSessionRepository = formAgentSessionRepository

    this.agentMessageRepository = agentMessageRepository
    this.agentMessageConnectRepository = new ConnectRepository(
      agentMessageRepository,
      "agentMessage",
    )
  }
  /**
   * Streams a agent response for a session
   * Handles the full flow: persist before, stream, persist after
   */
  async *streamAgentResponse({
    connectScope,
    sessionId,
    agent,
    userContent,
    documentId,
  }: {
    connectScope: RequiredConnectScope
    sessionId: string
    agent: Agent
    userContent: string
    documentId?: string
  }): AsyncGenerator<MessageEvent, void, unknown> {
    // Step 1: Prepare for streaming (persist user message + empty assistant message)
    const { session: updatedSession, assistantMessageId } = await this.prepareForStreaming({
      connectScope,
      sessionId,
      userContent,
      documentId,
      agentType: agent.type,
    })

    // Step 2: Send start event with messageId so frontend can update optimistic message
    yield {
      data: JSON.stringify({
        type: "start",
        messageId: assistantMessageId,
      }),
    } as MessageEvent

    // Step 3: Build LLM config from agent
    const llmConfig = this.buildLLMConfig({
      systemPrompt: this.generateMasterPrompt(agent),
      model: agent.model,
      temperature: agent.temperature,
    })

    // Step 4: Build LLM metadata (used for telemetry)
    const llmMetadata: LLMMetadata = {
      traceId: updatedSession.traceId,
      agentSessionId: updatedSession.id,
      agentId: agent.id,
      projectId: agent.projectId,
      organizationId: updatedSession.organizationId,
      currentTurn: updatedSession.messages.filter((m) => m.role === "user").length,
      tags: [agent.name],
    }

    // Step 5: Convert messages to LLM format
    // Messages are already loaded via relations in prepareForStreaming
    const llmMessages = await this.convertToLLMFormat(updatedSession.messages)

    // Step 6: Stream response
    let fullContent = ""

    try {
      if (documentId) await this.handleFileInLLMMessage({ llmMessages, documentId, connectScope })

      // Stream from LLM provider
      for await (const chunk of this.getProviderForModel(llmConfig.model).streamChatResponse({
        messages: llmMessages,
        config: llmConfig,
        metadata: llmMetadata,
      })) {
        fullContent += chunk

        // Yield chunk to frontend immediately (SSE)
        yield {
          data: JSON.stringify({
            type: "chunk",
            content: chunk,
            messageId: assistantMessageId,
          }),
        } as MessageEvent
      }

      // Step 7: Finalize streaming (persist completed message)
      await this.finalizeStreaming({
        sessionId: updatedSession.id,
        assistantMessageId,
        fullContent,
        agentType: agent.type,
      })

      // Send completion event
      yield {
        data: JSON.stringify({
          type: "end",
          messageId: assistantMessageId,
          fullContent,
        }),
      } as MessageEvent
    } catch (error) {
      // Handle error: mark message as error
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      await this.markStreamingError({
        sessionId: updatedSession.id,
        assistantMessageId,
        errorMessage,
        agentType: agent.type,
      })

      // Send error event
      yield {
        data: JSON.stringify({
          type: "error",
          messageId: assistantMessageId,
          error: errorMessage,
        }),
      } as MessageEvent

      throw error
    }
  }

  private async handleFileInLLMMessage({
    llmMessages,
    documentId,
    connectScope,
  }: {
    llmMessages: LLMChatMessage[]
    documentId: string
    connectScope: RequiredConnectScope
  }) {
    const message = llmMessages.pop() // remove last message
    if (documentId && message) {
      const document = await this.documentsService.findById({ connectScope, documentId })
      if (!document) {
        throw new Error(`Document with ID ${documentId} not found`)
      }

      const url = await this.fileStorageService.getTemporaryUrl(document.storageRelativePath)

      const llmMessage: LLMChatMessage = {
        role: "user",
        content: [{ type: "text", text: message.content as string }],
      }

      const hasStorageBucketName: boolean = !!process.env.GCS_STORAGE_BUCKET_NAME

      switch (document.mimeType) {
        case "application/pdf":
          {
            const data = new URL(
              hasStorageBucketName
                ? url
                : "https://www.impots.gouv.fr/sites/default/files/formulaires/2042/2025/2042_5180.pdf",
            )

            const content = llmMessage.content as Array<FilePart>
            content.push({
              type: "file",
              mediaType: "application/pdf",
              data,
              filename: document.fileName, // optional, not used by all providers
            })
          }
          break

        case "image/png":
        case "image/jpeg":
        case "image/jpg":
          {
            const image = new URL(
              hasStorageBucketName
                ? url
                : "https://www.oiseaux.net/photos/marc.fasol/images/id/canard.colvert.mafa.3p.230.h.jpg",
            )

            const content = llmMessage.content as Array<ImagePart>
            content.push({ type: "image", image })
          }
          break

        default:
          throw new Error(`Unsupported document type: ${document.mimeType}`)
      }

      llmMessages.push(llmMessage) // re-insert message in the stack
    }
  }

  /**
   * Converts ConversationAgentSession messages to LLM provider format
   */
  private async convertToLLMFormat(
    messages: ConversationAgentSession["messages"],
  ): Promise<LLMChatMessage[]> {
    const llmMessages: LLMChatMessage[] = []

    for (const message of messages) {
      // Skip streaming messages (they're not complete yet)
      if (message.status === "streaming") {
        continue
      }

      // Skip aborted messages
      if (message.status === "aborted") {
        continue
      }

      // Skip messages with empty content (AI SDK requires non-empty content)
      if (!message.content || message.content.trim().length === 0) {
        continue
      }

      llmMessages.push({
        role: message.role === "user" ? "user" : "assistant",
        content: message.content,
      })
    }

    return llmMessages
  }

  private generateMasterPrompt(agent: Agent): string {
    return `
Today's date: ${new Date().toLocaleDateString()}

${agent.defaultPrompt}

# Attachment:
If there is a file (image or pdf) attached to the user's chat message, answer the user's question or instruction reading the content of the file.

Always answer in ${agent.locale}.
  `.trim()
  }

  /**
   * Finds a session by ID and recovers aborted streams
   */
  async findSessionById({
    sessionId,
    agentType,
  }: {
    sessionId: string
    agentType: Agent["type"]
  }): Promise<ConversationAgentSession | FormAgentSession | null> {
    const repository =
      agentType === "conversation"
        ? this.conversationAgentSessionRepository
        : this.formAgentSessionRepository
    const session = await repository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!session) {
      return null
    }

    // Recover aborted streams
    await this.recoverAbortedStreams(sessionId)

    // Reload session with updated messages
    return repository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })
  }

  /**
   * Prepares session for streaming
   * Persists user message + empty assistant message with status "streaming"
   */
  async prepareForStreaming({
    agentType,
    connectScope,
    documentId,
    sessionId,
    userContent,
  }: {
    agentType: Agent["type"]
    connectScope: RequiredConnectScope
    documentId?: string
    sessionId: string
    userContent: string
  }): Promise<{
    session: ConversationAgentSession | FormAgentSession
    assistantMessageId: string
  }> {
    const session = await this.findSessionById({ sessionId, agentType })

    if (!session) {
      throw new NotFoundException(`AgentSession with id ${sessionId} not found`)
    }

    // Create user message
    await this.agentMessageConnectRepository.createAndSave(connectScope, {
      sessionId,
      role: "user",
      content: userContent,
      status: null,
      startedAt: null,
      completedAt: null,
      toolCalls: null,
      documentId: documentId ?? null,
    })

    // Create empty assistant message with streaming status
    const assistantMessageId = v4()
    await this.agentMessageConnectRepository.createAndSave(connectScope, {
      id: assistantMessageId,
      sessionId,
      role: "assistant",
      content: "",
      status: "streaming",
      startedAt: new Date(),
      completedAt: null,
      toolCalls: null,
    })

    // Reload session with messages
    const repository =
      agentType === "conversation"
        ? this.conversationAgentSessionRepository
        : this.formAgentSessionRepository

    const updatedSession = await repository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!updatedSession) {
      throw new NotFoundException(`AgentSession with id ${sessionId} not found`)
    }

    return { session: updatedSession, assistantMessageId }
  }

  /**
   * Finalizes streaming by updating assistant message
   * Sets status to "completed" and adds full content
   */
  async finalizeStreaming({
    agentType,
    assistantMessageId,
    fullContent,
    sessionId,
  }: {
    agentType: Agent["type"]
    assistantMessageId: string
    fullContent: string
    sessionId: string
  }): Promise<ConversationAgentSession | FormAgentSession> {
    const message = await this.agentMessageRepository.findOne({
      where: { id: assistantMessageId, sessionId },
    })

    if (!message) {
      throw new NotFoundException(
        `ChatMessage with id ${assistantMessageId} not found in session ${sessionId}`,
      )
    }

    message.content = fullContent
    message.status = "completed"
    message.completedAt = new Date()
    await this.agentMessageRepository.save(message)

    const repository =
      agentType === "conversation"
        ? this.conversationAgentSessionRepository
        : this.formAgentSessionRepository
    const session = await repository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!session) {
      throw new NotFoundException(`ConversationAgentSession with id ${sessionId} not found`)
    }

    return session
  }

  /**
   * Marks a streaming message as error
   */
  async markStreamingError({
    agentType,
    assistantMessageId,
    errorMessage,
    sessionId,
  }: {
    agentType: Agent["type"]
    assistantMessageId: string
    errorMessage: string
    sessionId: string
  }): Promise<ConversationAgentSession | FormAgentSession> {
    const message = await this.agentMessageRepository.findOne({
      where: { id: assistantMessageId, sessionId },
    })

    if (!message) {
      throw new NotFoundException(
        `ChatMessage with id ${assistantMessageId} not found in session ${sessionId}`,
      )
    }

    message.content = errorMessage
    message.status = "error"
    message.completedAt = new Date()
    await this.agentMessageRepository.save(message)

    const repository =
      agentType === "conversation"
        ? this.conversationAgentSessionRepository
        : this.formAgentSessionRepository
    const session = await repository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!session) {
      throw new NotFoundException(`ConversationAgentSession with id ${sessionId} not found`)
    }

    return session
  }

  /**
   * Recovers aborted streams in a session
   * Marks old "streaming" messages as "aborted"
   */
  private async recoverAbortedStreams(sessionId: string): Promise<void> {
    const messages = await this.agentMessageRepository.find({
      where: {
        sessionId,
        role: "assistant",
        status: "streaming",
      },
    })

    for (const message of messages) {
      if (this.isStreamAborted(message)) {
        message.status = "aborted"
        await this.agentMessageRepository.save(message)
      }
    }
  }

  /**
   * Checks if a streaming message should be marked as aborted
   */
  private isStreamAborted(message: AgentMessage): boolean {
    if (!message.startedAt) {
      return false
    }

    const startedAt =
      message.startedAt instanceof Date ? message.startedAt : new Date(message.startedAt)
    const now = new Date()
    const elapsed = now.getTime() - startedAt.getTime()

    return elapsed > this.STREAM_TIMEOUT_MS
  }
}
