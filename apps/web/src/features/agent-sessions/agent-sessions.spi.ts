import type { AgentSession, AgentSessionMessage } from "./agent-sessions.models"

export interface IAgentSessionsSpi {
  getAllPlaygroundSessions: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<AgentSession[]>
  getAllAppSessions: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<AgentSession[]>
  createPlaygroundSession: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<AgentSession>
  createAppSession: (params: {
    organizationId: string
    projectId: string
    agentId: string
    agentSessionType: "app-private"
  }) => Promise<AgentSession>
  getMessages: (sessionId: string) => Promise<AgentSessionMessage[]>
}
