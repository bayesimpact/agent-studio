import type { TimeType } from "../generic"

export type ChatSessionTypeDto =
  | "playground"
  | "production"
  | "end-user-private"
  | "end-user-public"

export type ChatSessionDto = {
  id: string
  chatbotId: string
  type: ChatSessionTypeDto
  expiresAt: TimeType | null
}
