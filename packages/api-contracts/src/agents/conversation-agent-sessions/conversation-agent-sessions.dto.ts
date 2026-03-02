import type { TimeType } from "../../generic"

export type ConversationAgentSessionTypeDto = "playground" | "live"

export type ConversationAgentSessionDto = {
  id: string
  agentId: string
  type: ConversationAgentSessionTypeDto
  createdAt: TimeType
  updatedAt: TimeType
  traceUrl?: string
}
