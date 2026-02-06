import type { AgentSession, AgentSessionMessage } from "./chat-sessions.models"

export interface IChatSessionsSpi {
  getAllPlayground: (agentId: string) => Promise<AgentSession[]>
  getAllApp: (agentId: string) => Promise<AgentSession[]>
  createPlaygroundSession: (agentId: string) => Promise<AgentSession>
  createAppSession: (params: {
    agentId: string
    agentSessionType: "app-private"
  }) => Promise<AgentSession>
  getMessages: (sessionId: string) => Promise<AgentSessionMessage[]>
}
