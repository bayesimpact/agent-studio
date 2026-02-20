import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type {
  CreateProjectRequestDto,
  CreateProjectResponseDto,
  InviteProjectMembersRequestDto,
  InviteProjectMembersResponseDto,
  ListProjectMembershipsResponseDto,
  ListProjectsResponseDto,
  RemoveProjectMembershipResponseDto,
  UpdateProjectRequestDto,
  UpdateProjectResponseDto,
} from "./projects.dto"

export const ProjectsRoutes = {
  createOne: defineRoute<
    ResponseData<CreateProjectResponseDto>,
    RequestPayload<CreateProjectRequestDto>
  >({
    method: "post",
    path: "organizations/:organizationId/projects",
  }),
  getAll: defineRoute<ResponseData<ListProjectsResponseDto>>({
    method: "get",
    path: "organizations/:organizationId/projects",
  }),
  updateOne: defineRoute<
    ResponseData<UpdateProjectResponseDto>,
    RequestPayload<UpdateProjectRequestDto>
  >({
    method: "patch",
    path: "organizations/:organizationId/projects/:projectId",
  }),
  deleteOne: defineRoute<ResponseData<{ success: boolean }>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId",
  }),

  // --- Project Membership Routes ---
  listProjectMemberships: defineRoute<ResponseData<ListProjectMembershipsResponseDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/memberships",
  }),
  inviteProjectMembers: defineRoute<
    ResponseData<InviteProjectMembersResponseDto>,
    RequestPayload<InviteProjectMembersRequestDto>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/memberships/invite",
  }),
  removeProjectMembership: defineRoute<ResponseData<RemoveProjectMembershipResponseDto>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId/memberships/:membershipId",
  }),
}
