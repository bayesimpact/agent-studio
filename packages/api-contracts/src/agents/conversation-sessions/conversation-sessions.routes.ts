import type { RequestPayload, ResponseData } from "../../generic"
import { defineRoute } from "../../helpers"
import type { AgentSessionDto, AgentSessionTypeDto } from "./conversation-sessions.dto"

export const ConversationAgentSessionsRoutes = {
  getAllPlaygroundSessions: defineRoute<ResponseData<AgentSessionDto[]>>({
    method: "get",
    path: "/organizations/:organizationId/projects/:projectId/agents/:agentId/playground/sessions",
  }),
  getAllAppSessions: defineRoute<ResponseData<AgentSessionDto[]>>({
    method: "get",
    path: "/organizations/:organizationId/projects/:projectId/agents/:agentId/app/sessions",
  }),
  createPlaygroundSession: defineRoute<ResponseData<AgentSessionDto>>({
    method: "post",
    path: "/organizations/:organizationId/projects/:projectId/agents/:agentId/playground-session",
  }),
  createAppSession: defineRoute<
    ResponseData<AgentSessionDto>,
    RequestPayload<{ agentSessionType: AgentSessionTypeDto }>
  >({
    method: "post",
    path: "/organizations/:organizationId/projects/:projectId/agents/:agentId/app-session",
  }),
}
