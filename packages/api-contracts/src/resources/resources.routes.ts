import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type { ResourceDto } from "./resources.dto"

export const ResourcesRoutes = {
  uploadOne: defineRoute<ResponseData<ResourceDto>, RequestPayload<{ file: File }>>({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/resources/upload/",
  }),
  getAll: defineRoute<ResponseData<ResourceDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/resources/",
  }),
  getTemporaryUrl: defineRoute<ResponseData<{ url: string }>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/resources/:resourceId/temporary-url",
  }),
  deleteOne: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId/resources/:resourceId",
  }),
}
