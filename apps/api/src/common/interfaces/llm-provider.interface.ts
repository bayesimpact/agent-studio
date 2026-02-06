/**
 * Chat message in normalized format for LLM providers
 */
export interface LLMChatMessage {
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
 * Metadata for LLM telemetry
 */
export interface LLMMetadata {
  traceId: string
  organizationId: string
  agentSessionId: string
  agentId: string
  projectId: string
  currentTurn: number
  tags: string[]
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
   * @param metadata - Metadata used for telemetry (organizationId, agentId, tags, ...)
   * @returns Async generator yielding text chunks
   */
  streamChatResponse(
    messages: LLMChatMessage[],
    config: LLMConfig,
    metadata: LLMMetadata,
  ): AsyncGenerator<string, void, unknown>
}
