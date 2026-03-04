import type { BaseAgentSessionTypeDto } from "@caseai-connect/api-contracts"
import type { FormAgentSession } from "./form-agent-sessions.models"

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
}
