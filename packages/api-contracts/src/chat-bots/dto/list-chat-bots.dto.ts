import type { TimeType } from "../../generic"

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
