/**
 * Chat message in normalized format for LLM providers
 */
export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

/**
 * Configuration for LLM requests
 */
export interface LLMConfig {
  model: string
  temperature: number
  systemPrompt?: string
}

/**
 * Interface for LLM providers
 * This abstraction allows swapping LLM libraries without changing business logic
 */
export interface LLMProvider {
  /**
   * Stream a chat response from the LLM
   * @param messages - Chat messages in normalized format
   * @param config - LLM configuration (model, temperature, system prompt)
   * @returns Async generator yielding text chunks
   */
  streamChatResponse(
    messages: ChatMessage[],
    config: LLMConfig,
  ): AsyncGenerator<string, void, unknown>
}
