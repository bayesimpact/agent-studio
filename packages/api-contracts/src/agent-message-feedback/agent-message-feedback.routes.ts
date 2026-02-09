import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { AgentMessageFeedbackDto } from "./agent-message-feedback.dto"

export const AgentMessageFeedbackRoutes = {
  createOne: defineRoute<
    ResponseData<AgentMessageFeedbackDto>,
    RequestPayload<{ content: string }>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agent-messages/:agentMessageId/feedbacks",
  }),
  getAll: defineRoute<ResponseData<{ feedbacks: AgentMessageFeedbackDto[] }>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/feedbacks",
  }),
}
