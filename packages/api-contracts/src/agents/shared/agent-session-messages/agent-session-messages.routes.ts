import type { RequestPayload, ResponseData } from "../../../generic"
import { defineRoute } from "../../../helpers"
import type { BaseAgentSessionTypeDto } from "../../conversation-agent-sessions/conversation-agent-sessions.dto"
import type { AgentSessionMessageDto } from "./agent-session-messages.dto"

export const AgentSessionMessagesRoutes = {
  listMessages: defineRoute<
    ResponseData<AgentSessionMessageDto[]>,
    RequestPayload<{ type: BaseAgentSessionTypeDto }>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/agent-sessions/:agentSessionId/messages",
  }),
}
