import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type { EvaluationDto, ListEvaluationsResponseDto } from "./evaluations.dto"

export const EvaluationsRoutes = {
  createOne: defineRoute<
    ResponseData<EvaluationDto>,
    RequestPayload<Pick<EvaluationDto, "input" | "expectedOutput">>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/evaluations",
  }),
  getAll: defineRoute<ResponseData<ListEvaluationsResponseDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/evaluations",
  }),
  updateOne: defineRoute<
    ResponseData<SuccessResponseDTO>,
    RequestPayload<Partial<Pick<EvaluationDto, "input" | "expectedOutput">>>
  >({
    method: "patch",
    path: "organizations/:organizationId/projects/:projectId/evaluations/:evaluationId",
  }),
  deleteOne: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId/evaluations/:evaluationId",
  }),
}
