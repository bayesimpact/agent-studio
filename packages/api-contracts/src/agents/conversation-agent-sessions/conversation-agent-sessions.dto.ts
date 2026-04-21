import type { TimeType } from "../../generic"

export type BaseAgentSessionTypeDto = "playground" | "live"

export type ConversationAgentSessionDto = {
  id: string
  agentId: string
  type: BaseAgentSessionTypeDto
  title?: string
  createdAt: TimeType
  updatedAt: TimeType
  traceUrl?: string
}
