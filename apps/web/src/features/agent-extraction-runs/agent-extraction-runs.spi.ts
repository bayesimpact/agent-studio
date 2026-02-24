import type {
  AgentExtractionRunSummary,
  ExecuteAgentExtractionResponse,
} from "./agent-extraction-runs.models"

export interface IAgentExtractionRunsSpi {
  getAll: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<AgentExtractionRunSummary[]>
  executeOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
    documentId: string
    promptOverride?: string
  }) => Promise<ExecuteAgentExtractionResponse>
}
