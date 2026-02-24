import type { TimeType } from "../generic"

export type AgentExtractionRunStatus = "success" | "failed"
export type AgentExtractionRunType = "playground" | "live"

export type AgentExtractionRunSummaryDto = {
  id: string
  agentId: string
  documentId: string
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

export type ExecuteAgentExtractionRequestDto = {
  documentId: string
  promptOverride?: string
}

export type ExecuteAgentExtractionResponseDto = {
  runId: string
  result: Record<string, unknown>
}

export type ListAgentExtractionRunsResponseDto = {
  runs: AgentExtractionRunSummaryDto[]
}
