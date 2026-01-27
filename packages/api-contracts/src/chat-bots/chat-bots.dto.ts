import type { TimeType } from "../generic"

export type CreateChatBotRequestDto = {
  name: string
  defaultPrompt: string
  projectId: string
}

export type CreateChatBotResponseDto = {
  id: string
  name: string
  defaultPrompt: string
  projectId: string
}

export type ChatBotDto = {
  id: string
  name: string
  defaultPrompt: string
  projectId: string
  createdAt: TimeType
  updatedAt: TimeType
}

export type ListChatBotsResponseDto = {
  chatBots: ChatBotDto[]
}

export type UpdateChatBotRequestDto = {
  name?: string
  defaultPrompt?: string
}

export type UpdateChatBotResponseDto = {
  id: string
  name: string
  defaultPrompt: string
  projectId: string
}
