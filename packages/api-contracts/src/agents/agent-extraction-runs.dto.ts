import type { TimeType } from "../generic"

export type AgentExtractionRunStatus = "success" | "failed"
export type AgentExtractionRunType = "playground" | "live"

export type AgentExtractionRunSummaryDto = {
  id: string
  agentId: string
  documentId: string
  documentFileName: string | null
  traceUrl?: string
  type: AgentExtractionRunType
  status: AgentExtractionRunStatus
  createdAt: TimeType
  updatedAt: TimeType
}

export type AgentExtractionRunDto = AgentExtractionRunSummaryDto & {
  result: Record<string, unknown> | null
  errorCode: string | null
  errorDetails: Record<string, unknown> | null
}

export type AgentExtractionResultDto = {
  runId: string
  result: Record<string, unknown>
}
