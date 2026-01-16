import type { RequestPayload, ResponseData } from "@/exports/dtos/generic"
import { defineRoute } from "@/helpers"
import type {
  CreateOrganizationRequestDto,
  CreateOrganizationResponseDto,
} from "./dto/create-organization.dto"

export const OrganizationsRoutes = {
  createOrganization: defineRoute<
    ResponseData<CreateOrganizationResponseDto>,
    RequestPayload<CreateOrganizationRequestDto>
  >({
    method: "post",
    path: "organizations",
  }),
}
