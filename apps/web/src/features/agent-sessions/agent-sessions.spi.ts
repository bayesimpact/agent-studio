import type { AgentSession, AgentSessionMessage } from "./agent-sessions.models"

export interface IAgentSessionsSpi {
  getAllPlayground: (agentId: string) => Promise<AgentSession[]>
  getAllApp: (agentId: string) => Promise<AgentSession[]>
  createPlaygroundSession: (agentId: string) => Promise<AgentSession>
  createAppSession: (params: {
    agentId: string
    agentSessionType: "app-private"
  }) => Promise<AgentSession>
  getMessages: (sessionId: string) => Promise<AgentSessionMessage[]>
}
