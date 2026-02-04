import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { ResourcesDto } from "./resources.dto"

export const ResourcesRoutes = {
  uploadOne: defineRoute<ResponseData<ResourcesDto>, RequestPayload<{ file: unknown }>>({
    // FIXME: better type for file
    method: "post",
    path: "projects/:projectId/resources/upload/",
  }),
}
