import type { TimeType } from "../generic"

export type ChatBotDto = {
  createdAt: TimeType
  defaultPrompt: string
  id: string
  name: string
  projectId: string
  updatedAt: TimeType
}

export type ListChatBotsResponseDto = {
  chatBots: ChatBotDto[]
}
