import type { EvaluationReport } from "./evaluation-reports.models"

export interface IEvaluationReportsSpi {
  getAll(params: {
    organizationId: string
    projectId: string
    evaluationId: string
  }): Promise<EvaluationReport[]>
  createOne(params: {
    organizationId: string
    projectId: string
    agentId: string
    evaluationId: string
  }): Promise<EvaluationReport>
}
