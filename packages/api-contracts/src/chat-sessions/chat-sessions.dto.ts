import type { TimeType } from "../generic"

export type ChatSessionTypeDto = "playground" | "production" | "app-private"

export type ChatSessionDto = {
  id: string
  chatBotId: string
  type: ChatSessionTypeDto
  createdAt: TimeType
  updatedAt: TimeType
}
