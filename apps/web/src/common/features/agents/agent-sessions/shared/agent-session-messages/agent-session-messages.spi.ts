import type { BaseAgentSessionTypeDto } from "@caseai-connect/api-contracts"
import type { AgentSessionMessage } from "./agent-session-messages.models"

type BaseParams = {
  organizationId: string
  projectId: string
  agentId: string
  agentSessionId: string
}
export interface IAgentSessionMessagesSpi {
  getAll: (
    params: BaseParams & { payload: { type: BaseAgentSessionTypeDto } },
  ) => Promise<AgentSessionMessage[]>
  getOne: (
    params: BaseParams & { messageId: string } & { payload: { type: BaseAgentSessionTypeDto } },
  ) => Promise<AgentSessionMessage>
}
