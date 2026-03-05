import type { BaseAgentSessionTypeDto } from "../../agents/conversation-agent-sessions/conversation-agent-sessions.dto"
import type { TimeType } from "../../generic"

export type FormAgentSessionDto = {
  agentId: string
  createdAt: TimeType
  id: string
  result?: Record<string, unknown>
  traceUrl?: string
  type: BaseAgentSessionTypeDto
  updatedAt: TimeType
}
