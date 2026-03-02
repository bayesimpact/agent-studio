import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { OrganizationDto } from "./organizations.dto"

export const OrganizationsRoutes = {
  createOrganization: defineRoute<
    ResponseData<OrganizationDto>,
    RequestPayload<Pick<OrganizationDto, "name">>
  >({
    method: "post",
    path: "organizations",
  }),
}
