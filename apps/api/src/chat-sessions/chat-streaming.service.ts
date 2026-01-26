import type { MessageEvent } from "@nestjs/common"
import { Inject, Injectable } from "@nestjs/common"
import type { ChatBot } from "@/chat-bots/chat-bot.entity"
import type {
  ChatMessage,
  LLMConfig,
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

    // Step 2: Convert messages to LLM format
    const llmMessages = this.convertToLLMFormat(updatedSession.messages)

    // Step 3: Build LLM config from chatbot
    const llmConfig = this.buildLLMConfig(chatbot)

    // Step 4: Stream response
    let fullContent = ""

    try {
      // Stream from LLM provider
      for await (const chunk of this.llmProvider.streamChatResponse(llmMessages, llmConfig)) {
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

      // Step 5: Finalize streaming (persist completed message)
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
      // Skip tool messages (they're handled differently in ai-sdk)
      if (message.role === "tool") {
        continue
      }

      // Skip streaming messages (they're not complete yet)
      if (message.status === "streaming") {
        continue
      }

      // Skip aborted messages
      if (message.status === "aborted") {
        continue
      }

      llmMessages.push({
        role: message.role === "user" ? "user" : "assistant",
        content: message.content,
      })
    }

    return llmMessages
  }

  /**
   * Builds LLM configuration from ChatBot entity
   */
  private buildLLMConfig(chatbot: ChatBot): LLMConfig {
    return {
      model: chatbot.model,
      temperature: chatbot.temperature,
      systemPrompt: chatbot.defaultPrompt,
    }
  }
}
