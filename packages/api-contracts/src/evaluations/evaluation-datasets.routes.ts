import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type {
  DatasetFileColumnDto,
  DatasetFileDto,
  EvaluationDatasetDto,
} from "./evaluation-datasets.dto"

const prefix = "organizations/:organizationId/projects/:projectId/evaluation-datasets"
export const EvaluationDatasetsRoutes = {
  getAllFiles: defineRoute<ResponseData<DatasetFileDto[]>>({
    method: "get",
    path: `${prefix}/files`,
  }),
  createOne: defineRoute<
    ResponseData<EvaluationDatasetDto>,
    RequestPayload<{ documentId: string; name: string }>
  >({
    method: "post",
    path: prefix,
  }),
  getColumns: defineRoute<
    ResponseData<DatasetFileColumnDto[]>,
    RequestPayload<{ documentId: string }>
  >({
    method: "post",
    path: `${prefix}/columns`,
  }),
  // getAll: defineRoute<ResponseData<EvaluationDatasetDto[]>>({
  //   method: "get",
  //   path: "organizations/:organizationId/projects/:projectId/evaluation-datasets",
  // }),
  // deleteOne: defineRoute<ResponseData<SuccessResponseDTO>>({
  //   method: "delete",
  //   path: "organizations/:organizationId/projects/:projectId/evaluation-datasets/:evaluationDatasetId",
  // }),
  // setColumnRoles: defineRoute<
  //   ResponseData<SetColumnRolesResponseDto>,
  //   RequestPayload<SetColumnRolesRequestDto>
  // >({
  //   method: "patch",
  //   path: "organizations/:organizationId/projects/:projectId/evaluation-datasets/:evaluationDatasetId/columns",
  // }),
}
