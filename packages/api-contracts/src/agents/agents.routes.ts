import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type { AgentDto, AgentWithDraftDto, CreateAgentDto, UpdateAgentNameDto } from "./agents.dto"

export const AgentsRoutes = {
  createOne: defineRoute<ResponseData<AgentDto>, RequestPayload<CreateAgentDto>>({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents",
  }),
  getAll: defineRoute<ResponseData<AgentDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents",
  }),
  getAllWithDrafts: defineRoute<ResponseData<AgentWithDraftDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents-with-drafts",
  }),
  updateOne: defineRoute<ResponseData<SuccessResponseDTO>, RequestPayload<UpdateAgentNameDto>>({
    method: "patch",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId",
  }),
  deleteOne: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId",
  }),
}
