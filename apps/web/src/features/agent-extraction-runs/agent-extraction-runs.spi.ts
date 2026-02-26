import type {
  AgentExtractionRun,
  AgentExtractionRunSummary,
  ExecuteAgentExtractionResponse,
} from "./agent-extraction-runs.models"

export interface IAgentExtractionRunsSpi {
  getAllPlayground: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<AgentExtractionRunSummary[]>
  getAllLive: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<AgentExtractionRunSummary[]>
  getOnePlayground: (params: {
    organizationId: string
    projectId: string
    agentId: string
    runId: string
  }) => Promise<AgentExtractionRun>
  getOneLive: (params: {
    organizationId: string
    projectId: string
    agentId: string
    runId: string
  }) => Promise<AgentExtractionRun>
  executePlaygroundOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
    documentId: string
    promptOverride?: string
  }) => Promise<ExecuteAgentExtractionResponse>
  executeLiveOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
    documentId: string
    promptOverride?: string
  }) => Promise<ExecuteAgentExtractionResponse>
}
