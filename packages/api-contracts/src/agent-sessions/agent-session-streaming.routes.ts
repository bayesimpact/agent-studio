import type { ResponseData } from "../generic"
import { defineRoute } from "../helpers"

// Streaming responses are sent as text/event-stream (SSE) and do not follow the usual ResponseData<T> shape.
// We still define a route for path/method typing. The response type is treated as unknown by clients.
export type AgentSessionStreamResponse = unknown

export const AgentSessionStreamingRoutes = {
  streamPlayground: defineRoute<ResponseData<AgentSessionStreamResponse>>({
    method: "get",
    path: "agent-sessions/:sessionId/stream",
  }),
}
