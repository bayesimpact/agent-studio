import type { BaseAgentSessionTypeDto } from "@caseai-connect/api-contracts"
import type { FormAgentSession, FormAgentSessionMessage } from "./form-agent-sessions.models"

export interface IFormAgentSessionsSpi {
  getAll: (params: {
    organizationId: string
    projectId: string
    agentId: string
    type: BaseAgentSessionTypeDto
  }) => Promise<FormAgentSession[]>
  createOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
    type: BaseAgentSessionTypeDto
  }) => Promise<FormAgentSession>
  getMessages: (params: {
    organizationId: string
    projectId: string
    agentId: string
    agentSessionId: string
    type: BaseAgentSessionTypeDto
  }) => Promise<FormAgentSessionMessage[]>
}
