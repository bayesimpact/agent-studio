import type {
  AgentLocale,
  AgentModel,
  AgentTemperature,
  TimeType,
} from "@caseai-connect/api-contracts"

export type ChatBot = {
  createdAt: TimeType
  defaultPrompt: string
  id: string
  locale: AgentLocale
  model: AgentModel
  name: string
  projectId: string
  temperature: AgentTemperature
  updatedAt: TimeType
}
