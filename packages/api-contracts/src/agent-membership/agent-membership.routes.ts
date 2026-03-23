import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type { AgentMembershipDto } from "./agent-membership.dto"

export const AgentMembershipRoutes = {
  getAll: defineRoute<ResponseData<AgentMembershipDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/memberships",
  }),
  createOne: defineRoute<
    ResponseData<AgentMembershipDto[]>,
    RequestPayload<{ emails: string[] }>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/memberships/invite",
  }),
  deleteOne: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/memberships/:agentMembershipId",
  }),
}
