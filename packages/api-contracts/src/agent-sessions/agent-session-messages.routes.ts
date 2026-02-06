import type { ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { ListAgentSessionMessagesResponseDto } from "./agent-session-messages.dto"

export const AgentSessionMessagesRoutes = {
  listMessages: defineRoute<ResponseData<ListAgentSessionMessagesResponseDto>>({
    method: "get",
    path: "agent-sessions/:sessionId/messages",
  }),
}
