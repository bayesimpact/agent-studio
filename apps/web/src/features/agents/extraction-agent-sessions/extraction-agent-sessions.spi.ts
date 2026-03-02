import type { ExtractionAgentSessionDto } from "@caseai-connect/api-contracts"
import type {
  ExtractionAgentSession,
  ExtractionAgentSessionResult,
  ExtractionAgentSessionSummary,
} from "./extraction-agent-sessions.models"

export interface IExtractionAgentSessionsSpi {
  getAll: (params: {
    organizationId: string
    projectId: string
    agentId: string
    type: ExtractionAgentSessionDto["type"]
  }) => Promise<ExtractionAgentSessionSummary[]>
  getOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
    runId: string
    type: ExtractionAgentSessionDto["type"]
  }) => Promise<ExtractionAgentSession>
  executeOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
    documentId: string
    type: ExtractionAgentSessionDto["type"]
  }) => Promise<ExtractionAgentSessionResult>
}
