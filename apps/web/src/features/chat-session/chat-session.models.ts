import type { ChatSessionDto } from "@caseai-connect/api-contracts"

export type ChatSession = ChatSessionDto

export type ChatSessionStatus = "idle" | "loading" | "succeeded" | "failed"

export type ChatSessionState = {
  session: ChatSession | null
  activeChatBotId: string | null
  status: ChatSessionStatus
  error: string | null
}
