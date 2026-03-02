import type { ConversationAgentSessionTypeDto } from "../../agents/conversation-agent-sessions/conversation-agent-sessions.dto"
import type { TimeType } from "../../generic"

export type ExtractionAgentSessionStatus = "success" | "failed"
export type ExtractionAgentSessionType = ConversationAgentSessionTypeDto

export type ExtractionAgentSessionSummaryDto = {
  id: string
  agentId: string
  documentId: string
  documentFileName: string | null
  traceUrl?: string
  type: ExtractionAgentSessionType
  status: ExtractionAgentSessionStatus
  createdAt: TimeType
  updatedAt: TimeType
}

export type ExtractionAgentSessionDto = ExtractionAgentSessionSummaryDto & {
  result: Record<string, unknown> | null
  errorCode: string | null
  errorDetails: Record<string, unknown> | null
}

export type ExtractionAgentSessionResultDto = {
  runId: string
  result: Record<string, unknown>
}
