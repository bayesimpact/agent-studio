import type { RequestPayload, ResponseData } from "../../generic"
import { defineRoute } from "../../helpers"
import type {
  ExtractionAgentSessionDto,
  ExtractionAgentSessionResultDto,
  ExtractionAgentSessionSummaryDto,
} from "./extraction-agent-sessions.dto"

export const ExtractionAgentSessionsRoutes = {
  executeOne: defineRoute<
    ResponseData<ExtractionAgentSessionResultDto>,
    RequestPayload<Pick<ExtractionAgentSessionSummaryDto, "documentId" | "type">>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/extraction-agent-sessions/execute",
  }),
  getAll: defineRoute<
    ResponseData<ExtractionAgentSessionSummaryDto[]>,
    RequestPayload<Pick<ExtractionAgentSessionSummaryDto, "type">>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/extraction-agent-sessions",
  }),
  getOne: defineRoute<
    ResponseData<ExtractionAgentSessionDto>,
    RequestPayload<Pick<ExtractionAgentSessionSummaryDto, "type">>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/extraction-agent-sessions/:runId",
  }),
}
