import type {
  ExtractionAgentSession,
  ExtractionAgentSessionResult,
  ExtractionAgentSessionSummary,
} from "./extraction-agent-sessions.models"

export interface IExtractionAgentSessionsSpi {
  getAllPlayground: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<ExtractionAgentSessionSummary[]>
  getAllLive: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<ExtractionAgentSessionSummary[]>
  getOnePlayground: (params: {
    organizationId: string
    projectId: string
    agentId: string
    runId: string
  }) => Promise<ExtractionAgentSession>
  getOneLive: (params: {
    organizationId: string
    projectId: string
    agentId: string
    runId: string
  }) => Promise<ExtractionAgentSession>
  executePlaygroundOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
    documentId: string
  }) => Promise<ExtractionAgentSessionResult>
  executeLiveOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
    documentId: string
  }) => Promise<ExtractionAgentSessionResult>
}
