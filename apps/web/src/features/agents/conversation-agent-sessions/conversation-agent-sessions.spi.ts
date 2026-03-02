import type { ConversationAgentSessionTypeDto } from "@caseai-connect/api-contracts"
import type {
  ConversationAgentSession,
  ConversationAgentSessionMessage,
} from "./conversation-agent-sessions.models"

export interface IConversationAgentSessionsSpi {
  getAll: (params: {
    organizationId: string
    projectId: string
    agentId: string
    type: ConversationAgentSessionTypeDto
  }) => Promise<ConversationAgentSession[]>
  createOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
    type: ConversationAgentSessionTypeDto
  }) => Promise<ConversationAgentSession>
  getMessages: (params: {
    organizationId: string
    projectId: string
    agentId: string
    agentSessionId: string
    type: ConversationAgentSessionTypeDto
  }) => Promise<ConversationAgentSessionMessage[]>
}
