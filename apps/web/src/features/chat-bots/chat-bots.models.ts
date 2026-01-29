import type {
  ChatBotLocale,
  ChatBotModel,
  ChatBotTemperature,
  TimeType,
} from "@caseai-connect/api-contracts"

export type ChatBot = {
  createdAt: TimeType
  defaultPrompt: string
  id: string
  locale: ChatBotLocale
  model: ChatBotModel
  name: string
  projectId: string
  temperature: ChatBotTemperature
  updatedAt: TimeType
}
