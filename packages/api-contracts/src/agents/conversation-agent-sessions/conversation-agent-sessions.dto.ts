import type { TimeType } from "../../generic"

export type AgentSessionTypeDto = "playground" | "production" | "app-private"

export type ConversationAgentSessionDto = {
  id: string
  agentId: string
  type: AgentSessionTypeDto
  createdAt: TimeType
  updatedAt: TimeType
  traceUrl?: string
}
