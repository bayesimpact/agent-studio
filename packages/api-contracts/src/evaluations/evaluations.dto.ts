import type { TimeType } from "../generic"

export type EvaluationDto = {
  createdAt: TimeType
  expectedOutput: string
  id: string
  input: string
  projectId: string
  updatedAt: TimeType
}

export type ListEvaluationsResponseDto = {
  evaluations: EvaluationDto[]
}
