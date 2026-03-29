import type { BaseAgentSessionTypeDto, SuccessResponseDTO } from "@caseai-connect/api-contracts"
import type { FormAgentSession } from "./form-agent-sessions.models"

type BaseParams = {
  organizationId: string
  projectId: string
  agentId: string
  type: BaseAgentSessionTypeDto
}
export interface IFormAgentSessionsSpi {
  getAll: (params: BaseParams) => Promise<FormAgentSession[]>
  createOne: (params: BaseParams) => Promise<FormAgentSession>
  deleteOne: (params: BaseParams & { agentSessionId: string }) => Promise<SuccessResponseDTO>
}
