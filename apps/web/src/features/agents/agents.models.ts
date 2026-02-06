import type {
  AgentLocale,
  AgentModel,
  AgentTemperature,
  TimeType,
} from "@caseai-connect/api-contracts"

export type Agent = {
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
