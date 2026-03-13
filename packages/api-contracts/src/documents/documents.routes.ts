import type { DocumentTagsUpdateFieldsDto } from "../document-tags/document-tag.dto"
import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type { DocumentDto } from "./documents.dto"

export const DocumentsRoutes = {
  uploadOne: defineRoute<ResponseData<DocumentDto>, RequestPayload<{ file: File }>>({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/documents/:sourceType/upload/",
  }),
  getAll: defineRoute<ResponseData<DocumentDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/documents",
  }),
  getTemporaryUrl: defineRoute<ResponseData<{ url: string }>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/documents/:documentId/temporary-url",
  }),
  updateOne: defineRoute<
    ResponseData<SuccessResponseDTO>,
    RequestPayload<Partial<Pick<DocumentDto, "title">> & DocumentTagsUpdateFieldsDto>
  >({
    method: "patch",
    path: "organizations/:organizationId/projects/:projectId/documents/:documentId",
  }),
  deleteOne: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId/documents/:documentId",
  }),
}
