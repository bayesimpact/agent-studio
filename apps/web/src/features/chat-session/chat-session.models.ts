import type { ChatSessionDto, ChatSessionMessageDto } from "@caseai-connect/api-contracts"

export type ChatSession = ChatSessionDto
export type ChatSessionMessage = ChatSessionMessageDto

export type ChatSessionStatus = "idle" | "loading" | "succeeded" | "failed"

export type ChatSessionState = {
  session: ChatSession | null
  activeChatBotId: string | null
  messages: ChatSessionMessage[]
  status: ChatSessionStatus
  error: string | null
}
