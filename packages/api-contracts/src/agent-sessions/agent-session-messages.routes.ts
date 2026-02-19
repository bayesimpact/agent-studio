import type { ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { AgentSessionMessageDto } from "./agent-session-messages.dto"

export const AgentSessionMessagesRoutes = {
  listMessages: defineRoute<ResponseData<AgentSessionMessageDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/agent-sessions/:agentSessionId/messages",
  }),
}
