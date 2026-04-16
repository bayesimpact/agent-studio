import type { TimeType } from "../generic"

// Types
export type EvaluationExtractionRunStatusDto = "pending" | "running" | "completed" | "failed"
export type EvaluationExtractionRunRecordStatusDto = "match" | "mismatch" | "error"
export type EvaluationExtractionRunRecordFieldStatusDto = "match" | "mismatch" | "fyi"

export type EvaluationExtractionRunKeyMappingEntryDto = {
  agentOutputKey: string
  datasetColumnId: string
  mode: "scored" | "fyi"
}

export type EvaluationExtractionRunSummaryDto = {
  total: number
  perfectMatches: number
  mismatches: number
  errors: number
}

export type EvaluationExtractionRunRecordFieldResultDto = {
  agentValue: unknown
  groundTruth: unknown
  status: EvaluationExtractionRunRecordFieldStatusDto
}

// DTOs
export type EvaluationExtractionRunDto = {
  id: string
  evaluationExtractionDatasetId: string
  agentId: string
  keyMapping: EvaluationExtractionRunKeyMappingEntryDto[]
  status: EvaluationExtractionRunStatusDto
  summary: EvaluationExtractionRunSummaryDto | null
  projectId: string
  createdAt: TimeType
  updatedAt: TimeType
}

export type EvaluationExtractionRunRecordDto = {
  id: string
  evaluationExtractionRunId: string
  evaluationExtractionDatasetRecordId: string
  status: EvaluationExtractionRunRecordStatusDto
  comparison: Record<string, EvaluationExtractionRunRecordFieldResultDto> | null
  agentRawOutput: Record<string, unknown> | null
  errorDetails: string | null
  createdAt: TimeType
  updatedAt: TimeType
}

// Request DTOs
export type CreateEvaluationExtractionRunRequestDto = {
  evaluationExtractionDatasetId: string
  agentId: string
  keyMapping: EvaluationExtractionRunKeyMappingEntryDto[]
}
