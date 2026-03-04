import type { BaseAgentSessionTypeDto } from "@caseai-connect/api-contracts"
import type { ConversationAgentSession } from "./conversation-agent-sessions.models"

export interface IConversationAgentSessionsSpi {
  getAll: (params: {
    organizationId: string
    projectId: string
    agentId: string
    type: BaseAgentSessionTypeDto
  }) => Promise<ConversationAgentSession[]>
  createOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
    type: BaseAgentSessionTypeDto
  }) => Promise<ConversationAgentSession>
}
