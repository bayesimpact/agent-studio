import type { MessageEvent } from "@nestjs/common"
import { Inject, Injectable } from "@nestjs/common"
import type { ChatBot } from "@/chat-bots/chat-bot.entity"
import type {
  ChatMessage,
  LLMConfig,
  LLMMetadata,
  LLMProvider,
} from "@/common/interfaces/llm-provider.interface"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ChatSession } from "./chat-session.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ChatSessionsService } from "./chat-sessions.service"

@Injectable()
export class ChatStreamingService {
  constructor(
    private readonly chatSessionsService: ChatSessionsService,
    @Inject("LLMProvider")
    private readonly llmProvider: LLMProvider,
  ) {}

  /**
   * Streams a chat response for a session
   * Handles the full flow: persist before, stream, persist after
   */
  async *streamChatResponse(
    session: ChatSession,
    chatbot: ChatBot,
    userContent: string,
  ): AsyncGenerator<MessageEvent, void, unknown> {
    // Step 1: Prepare for streaming (persist user message + empty assistant message)
    const { session: updatedSession, assistantMessageId } =
      await this.chatSessionsService.prepareForStreaming(session.id, userContent)

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

    // Step 4: Build LLM config from chatbot
    const llmConfig = this.buildLLMConfig(chatbot)

    // Step 5: Build LLM metadata (used for telemetry)
    const llmMetadata: LLMMetadata = this.buildLLMMetadata(chatbot, updatedSession)

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
      await this.chatSessionsService.finalizeStreaming(
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

      await this.chatSessionsService.markStreamingError(
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
   * Converts ChatSession messages to LLM provider format
   */
  private convertToLLMFormat(messages: ChatSession["messages"]): ChatMessage[] {
    const llmMessages: ChatMessage[] = []

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

  private generateMasterPrompt(chatbot: ChatBot): string {
    return `
Today's date: ${new Date().toLocaleDateString()}

${chatbot.defaultPrompt}

Always answer in ${chatbot.locale}.
  `.trim()
  }

  /**
   * Builds LLM configuration from ChatBot entity
   */
  private buildLLMConfig(chatbot: ChatBot): LLMConfig {
    // Convert temperature to number (database decimal types may be returned as strings)
    const temperature =
      typeof chatbot.temperature === "string"
        ? parseFloat(chatbot.temperature)
        : Number(chatbot.temperature)

    // Validate temperature is a valid number
    if (Number.isNaN(temperature) || temperature < 0 || temperature > 2) {
      throw new Error(
        `Invalid temperature value: ${chatbot.temperature}. Temperature must be a number between 0 and 2.`,
      )
    }

    const systemPrompt = this.generateMasterPrompt(chatbot)

    return {
      model: chatbot.model,
      temperature,
      systemPrompt,
    }
  }

  /**
   * Builds LLM metadata from ChatBot and ChatSession entities
   */
  private buildLLMMetadata(chatbot: ChatBot, session: ChatSession): LLMMetadata {
    return {
      chatSessionId: session.id,
      chatBotId: chatbot.id,
      projectId: chatbot.projectId,
      organizationId: session.organizationId,
      currentTurn: session.messages.filter((m) => m.role === "user").length,
      tags: [chatbot.name],
    }
  }
}
