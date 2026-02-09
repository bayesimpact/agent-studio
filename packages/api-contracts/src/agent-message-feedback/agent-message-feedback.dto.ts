import type { TimeType } from "../generic"

export type AgentMessageFeedbackDto = {
  id: string
  organizationId: string
  projectId: string
  agentMessageId: string
  userId: string
  content: string
  createdAt: TimeType
  updatedAt: TimeType
}
