import type { TimeType } from "../generic"

// Chat bot entity DTO
export type ChatBotDto = {
  id: string
  name: string
  defaultPrompt: string
  projectId: string
  createdAt: TimeType
  updatedAt: TimeType
}

// Create chat bot DTOs
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

// List chat bots DTOs
export type ListChatBotsResponseDto = {
  chatBots: ChatBotDto[]
}

// Update chat bot DTOs
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
