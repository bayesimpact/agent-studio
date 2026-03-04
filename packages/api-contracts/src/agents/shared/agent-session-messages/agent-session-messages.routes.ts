import type { RequestPayload, ResponseData } from "../../../generic"
import { defineRoute } from "../../../helpers"
import type { BaseAgentSessionTypeDto } from "../../conversation-agent-sessions/conversation-agent-sessions.dto"
import type { AgentSessionMessageDto } from "./agent-session-messages.dto"

// Streaming responses are sent as text/event-stream (SSE) and do not follow the usual ResponseData<T> shape.
// We still define a route for path/method typing. The response type is treated as unknown by clients.
export type AgentSessionStreamResponse = unknown

export const AgentSessionMessagesRoutes = {
  listMessages: defineRoute<
    ResponseData<AgentSessionMessageDto[]>,
    RequestPayload<{ type: BaseAgentSessionTypeDto }>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/agent-sessions/:agentSessionId/messages",
  }),
  stream: defineRoute<
    ResponseData<AgentSessionStreamResponse>,
    RequestPayload<{ content: string; documentId?: string }>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/agent-sessions/:agentSessionId/stream",
  }),
}
