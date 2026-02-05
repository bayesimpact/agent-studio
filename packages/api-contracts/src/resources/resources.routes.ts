import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { ResourceDto } from "./resources.dto"

export const ResourcesRoutes = {
  uploadOne: defineRoute<ResponseData<ResourceDto>, RequestPayload<{ file: File }>>({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/resources/upload/",
  }),
}
