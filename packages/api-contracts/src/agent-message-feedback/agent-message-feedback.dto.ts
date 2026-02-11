import type { TimeType } from "../generic"

export type AgentMessageFeedbackDto = {
  id: string
  organizationId: string
  projectId: string
  agentId: string
  agentSessionId: string
  agentMessageId: string
  agentMessageContent: string
  traceUrl?: string
  userId: string
  content: string
  createdAt: TimeType
}
