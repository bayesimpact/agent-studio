import type { SuccessResponseDTO } from "@caseai-connect/api-contracts"
import type { AgentMessageFeedback } from "./agent-message-feedback.models"

export interface IAgentMessageFeedbackSpi {
  getAll(params: {
    organizationId: string
    projectId: string
    agentId: string
  }): Promise<AgentMessageFeedback[]>
  createOne(params: {
    organizationId: string
    projectId: string
    agentMessageId: string
    content: string
  }): Promise<SuccessResponseDTO>
}
