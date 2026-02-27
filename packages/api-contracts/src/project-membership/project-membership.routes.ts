import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type { ProjectMembershipDto } from "./project-membership.dto"

export const ProjectMembershipRoutes = {
  getAll: defineRoute<ResponseData<ProjectMembershipDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/memberships",
  }),
  createOne: defineRoute<
    ResponseData<ProjectMembershipDto[]>,
    RequestPayload<{ emails: string[] }>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/memberships/invite",
  }),
  deleteOne: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId/memberships/:membershipId",
  }),
}
