import type { MessageEvent } from "@nestjs/common"
import { Inject, Injectable } from "@nestjs/common"
import type { Agent } from "@/agents/agent.entity"
import type {
  LLMChatMessage,
  LLMConfig,
  LLMMetadata,
  LLMProvider,
} from "@/common/interfaces/llm-provider.interface"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSession } from "./agent-session.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSessionsService } from "./agent-sessions.service"

@Injectable()
export class AgentStreamingService {
  constructor(
    private readonly agentSessionsService: AgentSessionsService,
    @Inject("LLMProvider")
    private readonly llmProvider: LLMProvider,
  ) {}

  /**
   * Streams a agent response for a session
   * Handles the full flow: persist before, stream, persist after
   */
  async *streamAgentResponse(
    session: AgentSession,
    agent: Agent,
    userContent: string,
  ): AsyncGenerator<MessageEvent, void, unknown> {
    // Step 1: Prepare for streaming (persist user message + empty assistant message)
    const { session: updatedSession, assistantMessageId } =
      await this.agentSessionsService.prepareForStreaming(session.id, userContent)

    // Step 2: Send start event with messageId so frontend can update optimistic message
    yield {
      data: JSON.stringify({
        type: "start",
        messageId: assistantMessageId,
      }),
    } as MessageEvent

    // Step 3: Convert messages to LLM format
    // Messages are already loaded via relations in prepareForStreaming
    const llmMessages = this.convertToLLMFormat(updatedSession.messages)

    // Step 4: Build LLM config from agent
    const llmConfig = this.buildLLMConfig(agent)

    // Step 5: Build LLM metadata (used for telemetry)
    const llmMetadata: LLMMetadata = this.buildLLMMetadata(agent, updatedSession)

    // Step 6: Stream response
    let fullContent = ""

    try {
      // Stream from LLM provider
      for await (const chunk of this.llmProvider.streamChatResponse(
        llmMessages,
        llmConfig,
        llmMetadata,
      )) {
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

  /**
   * Converts AgentSession messages to LLM provider format
   */
  private convertToLLMFormat(messages: AgentSession["messages"]): LLMChatMessage[] {
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
