import type { CreateOrganizationRequestDto, CreateOrganizationResponseDto } from "@repo/api"
import type { RequestPayload, ResponseData } from "@/exports/dtos/generic"
import { defineRoute } from "@/helpers"

export const OrganizationsRoutes = {
  createOrganization: defineRoute<
    ResponseData<CreateOrganizationResponseDto>,
    RequestPayload<CreateOrganizationRequestDto>
  >({
    method: "post",
    path: "organizations",
  }),
}
