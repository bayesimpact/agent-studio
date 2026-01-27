import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type {
  CreateOrganizationRequestDto,
  CreateOrganizationResponseDto,
} from "./organizations.dto"

export const OrganizationsRoutes = {
  createOrganization: defineRoute<
    ResponseData<CreateOrganizationResponseDto>,
    RequestPayload<CreateOrganizationRequestDto>
  >({
    method: "post",
    path: "organizations",
  }),
}
