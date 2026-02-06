import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { AgentSessionDto, AgentSessionTypeDto } from "./agent-sessions.dto"

export const AgentSessionsRoutes = {
  getAllPlayground: defineRoute<ResponseData<AgentSessionDto[]>>({
    method: "get",
    path: "agents/:agentId/playground/sessions",
  }),
  getAllApp: defineRoute<ResponseData<AgentSessionDto[]>>({
    method: "get",
    path: "agents/:agentId/app/sessions",
  }),
  createPlaygroundSession: defineRoute<ResponseData<AgentSessionDto>>({
    method: "post",
    path: "agents/:agentId/playground-session",
  }),
  createAppSession: defineRoute<
    ResponseData<AgentSessionDto>,
    RequestPayload<{ agentSessionType: AgentSessionTypeDto }>
  >({
    method: "post",
    path: "agents/:agentId/app-session",
  }),
}
