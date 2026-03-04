import type { RequestPayload, ResponseData } from "../../generic"
import { defineRoute } from "../../helpers"
import type {
  BaseAgentSessionTypeDto,
  ConversationAgentSessionDto,
} from "./conversation-agent-sessions.dto"

type Request = RequestPayload<{ type: BaseAgentSessionTypeDto }>
export const ConversationAgentSessionsRoutes = {
  getAll: defineRoute<ResponseData<ConversationAgentSessionDto[]>, Request>({
    method: "post",
    path: "/organizations/:organizationId/projects/:projectId/agents/:agentId/conversation-agent-sessions",
  }),
  createOne: defineRoute<ResponseData<ConversationAgentSessionDto>, Request>({
    method: "post",
    path: "/organizations/:organizationId/projects/:projectId/agents/:agentId/conversation-agent-sessions/create",
  }),
}
