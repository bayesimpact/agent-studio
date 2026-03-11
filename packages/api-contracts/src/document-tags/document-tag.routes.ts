import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type { DocumentTagDto } from "./document-tag.dto"

export const DocumentTagsRoutes = {
  createOne: defineRoute<
    ResponseData<DocumentTagDto>,
    RequestPayload<
      Pick<DocumentTagDto, "name"> & Partial<Pick<DocumentTagDto, "description" | "parentId">>
    >
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/document-tags",
  }),
  getAll: defineRoute<ResponseData<DocumentTagDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/document-tags",
  }),
  getOne: defineRoute<ResponseData<DocumentTagDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/document-tags/:documentTagId",
  }),
  updateOne: defineRoute<
    ResponseData<SuccessResponseDTO>,
    RequestPayload<Partial<Pick<DocumentTagDto, "name" | "description" | "parentId">>>
  >({
    method: "patch",
    path: "organizations/:organizationId/projects/:projectId/document-tags/:documentTagId",
  }),
  deleteOne: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId/document-tags/:documentTagId",
  }),
}
