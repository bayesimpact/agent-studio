import type { BaseAgentSessionTypeDto } from "@caseai-connect/api-contracts"
import type { AgentSessionMessage } from "./agent-session-messages.models"

export interface IAgentSessionMessagesSpi {
  getAll: (params: {
    organizationId: string
    projectId: string
    agentId: string
    agentSessionId: string
    type: BaseAgentSessionTypeDto
  }) => Promise<AgentSessionMessage[]>
}
