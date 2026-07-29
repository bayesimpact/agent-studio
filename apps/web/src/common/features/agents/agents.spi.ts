import type {
  CreateAgentDto,
  PartialUpdateAgentDto,
  PublishAgentDto,
} from "@caseai-connect/api-contracts"
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
    payload: PartialUpdateAgentDto,
  ) => Promise<void>
  deleteOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<void>
  getHistory: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<Agent[]>
  restoreRevision: (params: {
    organizationId: string
    projectId: string
    agentId: string
    revision: number
  }) => Promise<void>
  publishRevision: (
    params: {
      organizationId: string
      projectId: string
      agentId: string
      revision: number
    },
    payload: PublishAgentDto,
  ) => Promise<Agent>
}
