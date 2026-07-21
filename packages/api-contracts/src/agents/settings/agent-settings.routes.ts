import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../../generic"
import { defineRoute } from "../../helpers"
import type { AgentDto, PublishAgentDto } from "../agents.dto"

export const AgentSettingsRoutes = {
  getAll: defineRoute<ResponseData<AgentDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/settings",
  }),
  restoreOne: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/settings/:revision/restore",
  }),
  publishOne: defineRoute<ResponseData<AgentDto>, RequestPayload<PublishAgentDto>>({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/settings/:revision/publishOne",
  }),
  archiveOne: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/settings/:revision/archiveOne",
  }),
}
