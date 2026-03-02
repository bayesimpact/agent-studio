import type { RequestPayload, ResponseData } from "../../generic"
import { defineRoute } from "../../helpers"
import type {
  AgentSessionTypeDto,
  ConversationAgentSessionDto,
} from "./conversation-agent-sessions.dto"

export const ConversationAgentSessionsRoutes = {
  getAllPlaygroundSessions: defineRoute<ResponseData<ConversationAgentSessionDto[]>>({
    method: "get",
    path: "/organizations/:organizationId/projects/:projectId/agents/:agentId/playground/sessions",
  }),
  getAllAppSessions: defineRoute<ResponseData<ConversationAgentSessionDto[]>>({
    method: "get",
    path: "/organizations/:organizationId/projects/:projectId/agents/:agentId/app/sessions",
  }),
  createPlaygroundSession: defineRoute<ResponseData<ConversationAgentSessionDto>>({
    method: "post",
    path: "/organizations/:organizationId/projects/:projectId/agents/:agentId/playground-session",
  }),
  createAppSession: defineRoute<
    ResponseData<ConversationAgentSessionDto>,
    RequestPayload<{ agentSessionType: AgentSessionTypeDto }>
  >({
    method: "post",
    path: "/organizations/:organizationId/projects/:projectId/agents/:agentId/app-session",
  }),
}
