import { URL } from "node:url"
import { type StreamEvent, type StreamEventPayload, ToolName } from "@caseai-connect/api-contracts"
import { Inject, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { FilePart, ImagePart, ToolSet } from "ai"
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
import { FormAgentSessionsService } from "@/domains/agents/form-agent-sessions/form-agent-sessions.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentsService } from "@/domains/documents/documents.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentChunkRetrievalService } from "@/domains/documents/embeddings/document-chunk-retrieval.service"
import {
  FILE_STORAGE_SERVICE,
  type IFileStorage,
} from "@/domains/documents/storage/file-storage.interface"
import { ProjectsService } from "@/domains/projects/projects.service"
import { ServiceWithLLM } from "@/external/llm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { McpClientService } from "@/external/mcp"
import { AgentMessage } from "../agent-message.entity"
import { buildConversationAgentPrompt } from "./master-promts/conversation-agent.prompt"
import { buildFormAgentPrompt } from "./master-promts/form-agent.prompt"
import { fillFormTool } from "./tools/fill-form.tool"
import { retrieveProjectDocumentChunksTool } from "./tools/retrieve-project-document-chunks.tool"
import { sourcesTool } from "./tools/sources.tool"
import type { ToolExecutionLog } from "./tools/tool-execution-log"

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

    @Inject(FormAgentSessionsService)
    private readonly formAgentSessionsService: FormAgentSessionsService,
    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService,

    private readonly documentChunkRetrievalService: DocumentChunkRetrievalService,
    private readonly mcpClientService: McpClientService,

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
    @Inject("MedGemmaLLMProvider")
    medGemmaLlmProvider: LLMProvider,
  ) {
    super({ mockLlmProvider, vertexLlmProvider, medGemmaLlmProvider })

    this.conversationAgentSessionRepository = conversationAgentSessionRepository

    this.formAgentSessionRepository = formAgentSessionRepository

    this.agentMessageRepository = agentMessageRepository
    this.agentMessageConnectRepository = new ConnectRepository(
      agentMessageRepository,
      "agentMessage",
    )
  }
  /**
   * Streams an agent response for a session.
   * Handles the full flow: persist before, stream, persist after.
   */
  async *streamAgentResponse({
    connectScope,
    sessionId,
    agent,
    userContent,
    documentId,
    notifyClient,
  }: {
    connectScope: RequiredConnectScope
    sessionId: string
    agent: Agent
    userContent: string
    documentId?: string
    notifyClient: NotifyClient
  }): AsyncGenerator<StreamEvent, void, unknown> {
    const { session: updatedSession, assistantMessageId } = await this.prepareForStreaming({
      connectScope,
      sessionId,
      userContent,
      documentId,
      agentType: agent.type,
    })

    yield this.sseEvent({ type: "start", messageId: assistantMessageId })

    let fullContent = ""

    try {
      const llmRequest = await this.buildLLMRequest({
        agent,
        sessionId,
        notifyClient,
        session: updatedSession,
        documentId,
        connectScope,
      })

      const chunks = this.getProviderForModel(llmRequest.config.model).streamChatResponse(
        llmRequest,
      )
      for await (const chunk of chunks) {
        fullContent += chunk
        yield this.sseEvent({ type: "chunk", content: chunk, messageId: assistantMessageId })
      }

      await this.finalizeStreaming({
        sessionId: updatedSession.id,
        assistantMessageId,
        fullContent,
        agentType: agent.type,
      })

      yield this.sseEvent({ type: "end", messageId: assistantMessageId, fullContent })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      await this.markStreamingError({
        sessionId: updatedSession.id,
        assistantMessageId,
        errorMessage,
        agentType: agent.type,
      })

      yield this.sseEvent({ type: "error", messageId: assistantMessageId, error: errorMessage })

      throw error
    }
  }

  private sseEvent<T extends StreamEventPayload["type"]>(
    payload: Extract<StreamEventPayload, { type: T }>,
  ): Extract<StreamEvent, { type: T }> {
    return { data: JSON.stringify(payload) } as Extract<StreamEvent, { type: T }>
  }

  private async buildLLMRequest({
    agent,
    sessionId,
    notifyClient,
    session,
    documentId,
    connectScope,
  }: {
    agent: Agent
    sessionId: string
    notifyClient: NotifyClient
    session: ConversationAgentSession | FormAgentSession
    documentId?: string
    connectScope: RequiredConnectScope
  }) {
    const tools = await this.buildTools({
      agent,
      sessionId,
      connectScope,
      onExecute: async (toolExecution) =>
        await this.persistToolExecutionAndNotifyClient({
          connectScope,
          sessionId,
          notifyClient,
          toolExecution,
        }),
    })

    const toolNames = tools ? (Object.keys(tools) as ToolName[]) : []
    const config = this.buildLLMConfig({
      systemPrompt: this.generateMasterPrompt({ agent, toolNames }),
      model: agent.model,
      temperature: agent.temperature,
      tools,
    })

    const metadata: LLMMetadata = {
      traceId: session.traceId,
      agentSessionId: session.id,
      agentId: agent.id,
      projectId: agent.projectId,
      organizationId: session.organizationId,
      currentTurn: session.messages.filter((message) => message.role === "user").length,
      tags: [agent.name],
    }

    const messages = await this.convertToLLMFormat(session.messages)
    if (documentId)
      await this.handleFileInLLMMessage({ llmMessages: messages, documentId, connectScope })

    return { config, metadata, messages }
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

      if (message.role === "user" || message.role === "assistant") {
        llmMessages.push({
          role: message.role,
          content: message.content,
        })
      }
    }

    return llmMessages
  }

  private generateMasterPrompt(params: { agent: Agent; toolNames: ToolName[] }): string {
    const agentType = params.agent.type
    switch (agentType) {
      case "form":
        return buildFormAgentPrompt(params)
      case "conversation":
        return buildConversationAgentPrompt(params)
      default:
        throw new Error(`Unsupported agent type: ${agentType}`)
    }
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
    if (agentType !== "conversation" && agentType !== "form") {
      throw new Error(`Unsupported agent type: ${agentType}`)
    }
    const repository =
      agentType === "conversation"
        ? this.conversationAgentSessionRepository
        : this.formAgentSessionRepository
    const session = await repository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
      order: { messages: { createdAt: "ASC" } },
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
      order: { messages: { createdAt: "ASC" } },
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
    const updatedSession = await this.findSessionById({ sessionId, agentType })

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

    const session = await this.findSessionById({ sessionId, agentType })

    if (!session) {
      throw new NotFoundException(`AgentSession with id ${sessionId} not found`)
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

    const session = await this.findSessionById({ sessionId, agentType })

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

  private async buildTools({
    agent,
    sessionId,
    connectScope,
    onExecute,
  }: {
    agent: Agent
    sessionId: string
    connectScope: RequiredConnectScope
    onExecute: (toolExecution: ToolExecutionLog) => void
  }): Promise<ToolSet | undefined> {
    const hasSourcesTool = await this.projectsService.hasFeature({
      connectScope,
      feature: "sources_tool",
    })
    const hasMcpSocial = await this.projectsService.hasFeature({
      connectScope,
      feature: "bayes_social_mcp",
    })

    const mcpTools: ToolSet = {}
    if (hasMcpSocial) {
      const rawMcpTools = await this.mcpClientService.getTools()
      for (const [toolName, toolDef] of Object.entries(rawMcpTools)) {
        const originalExecute = toolDef.execute
        if (!originalExecute) continue
        mcpTools[toolName] = {
          ...toolDef,
          execute: (async (...executeArgs: Parameters<typeof originalExecute>) => {
            onExecute({
              toolName: toolName as ToolName,
              arguments: (executeArgs[0] ?? {}) as Record<string, unknown>,
            })
            return originalExecute(...executeArgs)
          }) as typeof originalExecute,
        }
      }
    }

    switch (agent.type) {
      case "conversation":
        return {
          [ToolName.RetrieveProjectDocumentChunks]: retrieveProjectDocumentChunksTool({
            connectScope,
            documentTagIds: agent.documentTags?.map((documentTag) => documentTag.id) ?? [],
            retrievalService: this.documentChunkRetrievalService,
            onExecute,
          }),
          ...(hasSourcesTool ? { [ToolName.Sources]: sourcesTool({ onExecute }) } : {}),
          ...mcpTools,
        } as ToolSet

      case "form":
        return {
          [ToolName.FillForm]: fillFormTool({
            connectScope,
            agent,
            sessionId,
            formAgentSessionsService: this.formAgentSessionsService,
            onExecute,
          }),
        } as ToolSet

      default:
        return undefined
    }
  }

  private async persistToolExecutionAndNotifyClient({
    connectScope,
    sessionId,
    notifyClient,
    toolExecution,
  }: {
    connectScope: RequiredConnectScope
    sessionId: string
    notifyClient: NotifyClient
    toolExecution: ToolExecutionLog
  }): Promise<void> {
    // Create a tool message in the database for each tool call, so that the session history is complete and reflects what actually happened during the agent execution (including tool calls)
    await this.agentMessageConnectRepository.createAndSave(connectScope, {
      id: v4(),
      sessionId,
      role: "tool",
      content: `${toolExecution.toolName} called`,
      status: "completed",
      startedAt: new Date(),
      completedAt: null,
      toolCalls: [
        {
          id: v4(),
          name: toolExecution.toolName,
          arguments: toolExecution.arguments,
        },
      ],
    })

    // Notify client about the form update so it can re-fetch the session and get the latest form state
    notifyClient(this.sseEvent({ type: "notify_client", toolName: toolExecution.toolName }))
  }
}

type NotifyClient = (event: Extract<StreamEvent, { type: "notify_client" }>) => void
