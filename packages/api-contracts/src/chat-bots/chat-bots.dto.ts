import type { TimeType } from "../generic"

export type ChatBotDto = {
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

export type ListChatBotsResponseDto = {
  chatBots: ChatBotDto[]
}

export enum ChatBotModel {
  Gemini25Flash = "gemini-2.5-flash",
  Gemini25Pro = "gemini-2.5-pro",
}

export enum ChatBotLocale {
  EN = "en",
  FR = "fr",
}

export type ChatBotTemperature = number // e.g., 0.7 float value
