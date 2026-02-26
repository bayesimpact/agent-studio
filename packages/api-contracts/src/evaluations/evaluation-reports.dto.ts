import type { TimeType } from "../generic"

export type EvaluationReportDto = {
  createdAt: TimeType
  id: string
  evaluationId: string
  agentId: string
  traceUrl: string
  output: string
  score: string
  updatedAt?: TimeType
}
