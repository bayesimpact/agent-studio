import type { Evaluation } from "./evaluations.models"

export interface IEvaluationsSpi {
  getAll(params: { organizationId: string; projectId: string }): Promise<Evaluation[]>
  createOne(
    params: { organizationId: string; projectId: string },
    payload: Pick<Evaluation, "input" | "expectedOutput">,
  ): Promise<Evaluation>
  updateOne(
    params: { organizationId: string; projectId: string; evaluationId: string },
    payload: Partial<Pick<Evaluation, "input" | "expectedOutput">>,
  ): Promise<void>
  deleteOne(params: {
    organizationId: string
    projectId: string
    evaluationId: string
  }): Promise<void>
}
