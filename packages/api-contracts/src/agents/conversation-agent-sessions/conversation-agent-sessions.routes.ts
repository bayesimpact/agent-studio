import type { RequestPayload, ResponseData } from "../../generic"
import { defineRoute } from "../../helpers"
import type {
  ConversationAgentSessionDto,
  ConversationAgentSessionTypeDto,
} from "./conversation-agent-sessions.dto"

type Request = RequestPayload<{ type: ConversationAgentSessionTypeDto }>
export const ConversationAgentSessionsRoutes = {
  getAll: defineRoute<ResponseData<ConversationAgentSessionDto[]>, Request>({
    method: "post",
    path: "/organizations/:organizationId/projects/:projectId/agents/:agentId/sessions",
  }),
  createOne: defineRoute<ResponseData<ConversationAgentSessionDto>, Request>({
    method: "post",
    path: "/organizations/:organizationId/projects/:projectId/agents/:agentId/session",
  }),
}
