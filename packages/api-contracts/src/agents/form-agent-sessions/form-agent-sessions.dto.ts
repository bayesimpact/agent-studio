import type { BaseAgentSessionTypeDto } from "../../agents/conversation-agent-sessions/conversation-agent-sessions.dto"
import type { TimeType } from "../../generic"

export type FormAgentSessionDto = {
  id: string
  agentId: string
  type: BaseAgentSessionTypeDto
  createdAt: TimeType
  updatedAt: TimeType
  traceUrl?: string
  result?: Record<string, unknown>
}
