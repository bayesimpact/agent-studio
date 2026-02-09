import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type { DocumentDto } from "./documents.dto"

export const DocumentsRoutes = {
  uploadOne: defineRoute<ResponseData<DocumentDto>, RequestPayload<{ file: File }>>({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/documents/upload/",
  }),
  getAll: defineRoute<ResponseData<DocumentDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/documents/",
  }),
  getTemporaryUrl: defineRoute<ResponseData<{ url: string }>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/documents/:documentId/temporary-url",
  }),
  deleteOne: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId/documents/:documentId",
  }),
}
