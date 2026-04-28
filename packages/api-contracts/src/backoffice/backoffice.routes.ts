import type { FeatureFlagKey } from "../feature-flags/feature-flags.dto"
import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type {
  BackofficeOrganizationDto,
  BackofficeProjectAgentCategoryDto,
  BackofficeUserDto,
  ReplaceBackofficeProjectAgentCategoriesDto,
} from "./backoffice.dto"

export const BackofficeRoutes = {
  listOrganizations: defineRoute<ResponseData<BackofficeOrganizationDto[]>>({
    method: "get",
    path: "backoffice/organizations",
  }),
  listUsers: defineRoute<ResponseData<BackofficeUserDto[]>>({
    method: "get",
    path: "backoffice/users",
  }),
  addFeatureFlag: defineRoute<
    ResponseData<SuccessResponseDTO>,
    RequestPayload<{ featureFlagKey: FeatureFlagKey }>
  >({
    method: "post",
    path: "backoffice/projects/:projectId/feature-flags",
  }),
  removeFeatureFlag: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "backoffice/projects/:projectId/feature-flags/:featureFlagKey",
  }),
  replaceProjectAgentCategories: defineRoute<
    ResponseData<BackofficeProjectAgentCategoryDto[]>,
    RequestPayload<ReplaceBackofficeProjectAgentCategoriesDto>
  >({
    method: "patch",
    path: "backoffice/projects/:projectId/agent-categories",
  }),
}
