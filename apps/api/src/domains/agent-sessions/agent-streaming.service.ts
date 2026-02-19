import { URL } from "node:url"
import type { MessageEvent } from "@nestjs/common"
import { Inject, Injectable } from "@nestjs/common"
import type { FilePart, ImagePart } from "ai"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type {
  LLMChatMessage,
  LLMConfig,
  LLMMetadata,
  LLMProvider,
} from "@/common/interfaces/llm-provider.interface"
import type { Agent } from "@/domains/agents/agent.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentsService } from "../documents/documents.service"
import {
  FILE_STORAGE_SERVICE,
  type IFileStorage,
} from "../documents/storage/file-storage.interface"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSession } from "./agent-session.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSessionsService } from "./agent-sessions.service"

@Injectable()
export class AgentStreamingService {
  constructor(
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorage,
    private readonly documentsService: DocumentsService,
    private readonly agentSessionsService: AgentSessionsService,
    @Inject("LLMProvider")
    private readonly llmProvider: LLMProvider,
  ) {}

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
    const { session: updatedSession, assistantMessageId } =
      await this.agentSessionsService.prepareForStreaming({
        connectScope,
        sessionId,
        userContent,
        documentId,
      })

    // Step 2: Send start event with messageId so frontend can update optimistic message
    yield {
      data: JSON.stringify({
        type: "start",
        messageId: assistantMessageId,
      }),
    } as MessageEvent

    // Step 3: Build LLM config from agent
    const llmConfig = this.buildLLMConfig(agent)

    // Step 4: Build LLM metadata (used for telemetry)
    const llmMetadata: LLMMetadata = this.buildLLMMetadata(agent, updatedSession)

    // Step 5: Convert messages to LLM format
    // Messages are already loaded via relations in prepareForStreaming
    const llmMessages = await this.convertToLLMFormat(updatedSession.messages)

    // Step 6: Stream response
    let fullContent = ""

    try {
      if (documentId) await this.handleFileInLLMMessage({ llmMessages, documentId, connectScope })

      // Stream from LLM provider
      const chunks = this.llmProvider.streamChatResponse(llmMessages, llmConfig, llmMetadata)
      for await (const chunk of chunks) {
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
      await this.agentSessionsService.finalizeStreaming(
        updatedSession.id,
        assistantMessageId,
        fullContent,
      )

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

      await this.agentSessionsService.markStreamingError(
        updatedSession.id,
        assistantMessageId,
        errorMessage,
      )

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
   * Converts AgentSession messages to LLM provider format
   */
  private async convertToLLMFormat(messages: AgentSession["messages"]): Promise<LLMChatMessage[]> {
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
   * Builds LLM configuration from Agent entity
   */
  private buildLLMConfig(agent: Agent): LLMConfig {
    // Convert temperature to number (database decimal types may be returned as strings)
    const temperature =
      typeof agent.temperature === "string"
        ? parseFloat(agent.temperature)
        : Number(agent.temperature)

    // Validate temperature is a valid number
    if (Number.isNaN(temperature) || temperature < 0 || temperature > 2) {
      throw new Error(
        `Invalid temperature value: ${agent.temperature}. Temperature must be a number between 0 and 2.`,
      )
    }

    const systemPrompt = this.generateMasterPrompt(agent)

    return {
      model: agent.model,
      temperature,
      systemPrompt,
    }
  }

  /**
   * Builds LLM metadata from Agent and AgentSession entities
   */
  private buildLLMMetadata(agent: Agent, session: AgentSession): LLMMetadata {
    return {
      traceId: session.traceId,
      agentSessionId: session.id,
      agentId: agent.id,
      projectId: agent.projectId,
      organizationId: session.organizationId,
      currentTurn: session.messages.filter((m) => m.role === "user").length,
      tags: [agent.name],
    }
  }
}
