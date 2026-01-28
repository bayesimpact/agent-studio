import type { TimeType } from "../generic"

export type ChatSessionTypeDto = "playground" | "production"

export type ChatSessionDto = {
  id: string
  chatbotId: string
  type: ChatSessionTypeDto
  expiresAt: TimeType | null
}

export type CreatePlaygroundSessionResponseDto = ChatSessionDto
