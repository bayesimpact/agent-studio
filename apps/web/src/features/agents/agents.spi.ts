import type { CreateAgentDto, UpdateAgentDto } from "@caseai-connect/api-contracts"
import type { Agent } from "./agents.models"

export interface IAgentsSpi {
  getAll: (params: { organizationId: string; projectId: string }) => Promise<Agent[]>
  createOne: (
    params: { organizationId: string; projectId: string },
    payload: CreateAgentDto,
  ) => Promise<Agent>
  updateOne: (
    params: { organizationId: string; projectId: string; agentId: string },
    payload: UpdateAgentDto,
  ) => Promise<void>
  deleteOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<void>
}
