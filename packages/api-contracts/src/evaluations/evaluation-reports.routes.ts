import type { ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { EvaluationReportDto } from "./evaluation-reports.dto"

export const EvaluationReportsRoutes = {
  createOne: defineRoute<ResponseData<EvaluationReportDto>>({
    method: "post",
    path: "/organizations/:organizationId/projects/:projectId/agents/:agentId/evaluations/:evaluationId/reports",
  }),
  getAll: defineRoute<ResponseData<EvaluationReportDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/evaluations/:evaluationId/reports",
  }),
}
