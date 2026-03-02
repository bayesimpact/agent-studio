import type { RequestPayload, ResponseData } from "../../generic"
import { defineRoute } from "../../helpers"

// Streaming responses are sent as text/event-stream (SSE) and do not follow the usual ResponseData<T> shape.
// We still define a route for path/method typing. The response type is treated as unknown by clients.
export type AgentSessionStreamResponse = unknown

export const AgentSessionStreamingRoutes = {
  stream: defineRoute<
    ResponseData<AgentSessionStreamResponse>,
    RequestPayload<{ content: string; documentId?: string }>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/agent-sessions/:sessionId/stream",
  }),
}
