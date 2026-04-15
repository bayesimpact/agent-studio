import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type {
  DatasetFileColumnDto,
  DatasetFileDto,
  EvaluationDatasetDto,
  EvaluationDatasetSchemaColumnDto,
} from "./evaluation-datasets.dto"

const prefix = "organizations/:organizationId/projects/:projectId/evaluation-datasets"
export const EvaluationDatasetsRoutes = {
  getAllFiles: defineRoute<ResponseData<DatasetFileDto[]>>({
    method: "get",
    path: `${prefix}/files`,
  }),
  getAll: defineRoute<ResponseData<EvaluationDatasetDto[]>>({
    method: "get",
    path: prefix,
  }),
  createOne: defineRoute<ResponseData<SuccessResponseDTO>, RequestPayload<{ name: string }>>({
    method: "post",
    path: `${prefix}/createOne`,
  }),
  updateOne: defineRoute<
    ResponseData<SuccessResponseDTO>,
    RequestPayload<{
      name: string
      columns: EvaluationDatasetSchemaColumnDto[]
    }>
  >({
    method: "patch",
    path: `${prefix}/:datasetId/file/:documentId/update`,
  }),
  getFileColumns: defineRoute<ResponseData<DatasetFileColumnDto[]>>({
    method: "get",
    path: `${prefix}/file/:documentId/columns`,
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
