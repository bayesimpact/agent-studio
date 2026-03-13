import type { DocumentTagDto } from "../document-tags/document-tag.dto"
import type { TimeType } from "../generic"

export type AgentType = "conversation" | "extraction" | "form"

export type AgentDto = {
  createdAt: TimeType
  defaultPrompt: string
  id: string
  locale: AgentLocale
  model: AgentModel
  name: string
  outputJsonSchema?: Record<string, unknown>
  projectId: string
  temperature: AgentTemperature
  type: AgentType
  updatedAt: TimeType
  documentTagIds: DocumentTagDto["id"][]
}

export type ListAgentsResponseDto = {
  agents: AgentDto[]
}

export enum AgentModel {
  Gemini25Flash = "gemini-2.5-flash",
  Gemini25Pro = "gemini-2.5-pro",
  _MockGenerateObject = "generate-object-mock-language-model-v3",
  _MockGenerateStructuredOutput = "generate-structured-output-mock-language-model-v3",
  _MockGenerateText = "generate-text-mock-language-model-v3",
  _MockProcessFiles = "process-files-mock-language-model-v3",
  _MockRate = "rate-mock-language-model-v3",
  _MockStreamChatResponse = "stream-chat-response-mock-language-model-v3",
}

export enum AgentLocale {
  EN = "en",
  FR = "fr",
}

export type AgentTemperature = number // e.g., 0.7 float value
