import type { CreateAgentDto, SuccessResponseDTO } from "@caseai-connect/api-contracts"
import type { Agent } from "./agents.models"

export interface IAgentsSpi {
  getAll: (params: { organizationId: string; projectId: string }) => Promise<Agent[]>
  getAllWithDrafts: (params: { organizationId: string; projectId: string }) => Promise<Agent[]>
  createOne: (
    params: { organizationId: string; projectId: string },
    payload: CreateAgentDto,
  ) => Promise<Agent>
  updateOne: (
    params: { organizationId: string; projectId: string; agentId: string },
    payload: { name: string },
  ) => Promise<SuccessResponseDTO>
  deleteOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<SuccessResponseDTO>
}
