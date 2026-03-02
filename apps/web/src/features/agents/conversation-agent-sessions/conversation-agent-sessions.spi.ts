import type {
  ConversationAgentSession,
  ConversationAgentSessionMessage,
} from "./conversation-agent-sessions.models"

export interface IConversationAgentSessionsSpi {
  getAllPlaygroundSessions: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<ConversationAgentSession[]>
  getAllAppSessions: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<ConversationAgentSession[]>
  createPlaygroundSession: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<ConversationAgentSession>
  createAppSession: (params: {
    organizationId: string
    projectId: string
    agentId: string
    agentSessionType: "app-private"
  }) => Promise<ConversationAgentSession>
  getMessages: (params: {
    organizationId: string
    projectId: string
    agentId: string
    agentSessionId: string
  }) => Promise<ConversationAgentSessionMessage[]>
}
