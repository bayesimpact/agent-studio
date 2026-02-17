import type { AgentModel } from "@caseai-connect/api-contracts"
import type { ModelMessage } from "ai"
import type { ZodObject, z } from "zod"
export type LLMChatMessage = ModelMessage

type MockModels =
  | AgentModel._MockGenerateObject
  | AgentModel._MockGenerateText
  | AgentModel._MockProcessFiles
  | AgentModel._MockStreamChatResponse
export type LLMConfig =
  | {
      model: MockModels
      temperature: number
      systemPrompt?: string
      mockResult: string | string[]
    }
  | {
      model: Exclude<string, MockModels>
      temperature: number
      systemPrompt?: string
      mockResult?: never
    }

export interface LLMMetadata {
  traceId: string
  organizationId: string
  agentSessionId: string
  agentId: string
  projectId: string
  currentTurn: number
  tags: string[]
}

export interface LLMProvider {
  streamChatResponse({
    messages,
    config,
    metadata,
  }: {
    messages: LLMChatMessage[]
    config: LLMConfig
    metadata: LLMMetadata
  }): AsyncGenerator<string, void, unknown>

  generateChatResponse({
    message,
    config,
    metadata,
  }: {
    message: LLMChatMessage
    config: LLMConfig
    metadata: LLMMetadata
  }): Promise<string>

  generateText({
    prompt,
    config,
    metadata,
  }: {
    prompt: string
    config: LLMConfig
    metadata: LLMMetadata
  }): Promise<string>
  // biome-ignore lint/suspicious/noExplicitAny: @Did ? une idée
  generateObject<T extends ZodObject<any>>({
    schema,
    prompt,
    config,
    metadata,
  }: {
    schema: T
    prompt: string
    config: LLMConfig
    metadata: LLMMetadata
  }): Promise<z.infer<T>>

  processFiles({
    prompt,
    files,
    config,
    metadata,
  }: {
    prompt: string
    files: LLMFile[]
    config: LLMConfig
    metadata: LLMMetadata
  }): Promise<string>
}

export interface LLMFile {
  name: string
  content: NonSharedBuffer
  mediaType: string
}
