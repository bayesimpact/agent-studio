import type { AgentExtractionRunSummary } from "./agent-extraction-runs.models"

export interface IAgentExtractionRunsSpi {
  getAll: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<AgentExtractionRunSummary[]>
}
