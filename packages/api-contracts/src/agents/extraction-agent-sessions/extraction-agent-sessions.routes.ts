import type { RequestPayload, ResponseData } from "../../generic"
import { defineRoute } from "../../helpers"
import type {
  ExtractionAgentSessionDto,
  ExtractionAgentSessionResultDto,
  ExtractionAgentSessionSummaryDto,
} from "./extraction-agent-sessions.dto"

export const ExtractionAgentSessionsRoutes = {
  executePlaygroundOne: defineRoute<
    ResponseData<ExtractionAgentSessionResultDto>,
    RequestPayload<Pick<ExtractionAgentSessionSummaryDto, "documentId">>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/playground/extract",
  }),
  executeLiveOne: defineRoute<
    ResponseData<ExtractionAgentSessionResultDto>,
    RequestPayload<Pick<ExtractionAgentSessionSummaryDto, "documentId">>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/live/extract",
  }),
  getAllPlayground: defineRoute<ResponseData<ExtractionAgentSessionSummaryDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/playground/extraction-runs",
  }),
  getAllLive: defineRoute<ResponseData<ExtractionAgentSessionSummaryDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/live/extraction-runs",
  }),
  getOnePlayground: defineRoute<ResponseData<ExtractionAgentSessionDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/playground/extraction-runs/:runId",
  }),
  getOneLive: defineRoute<ResponseData<ExtractionAgentSessionDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/live/extraction-runs/:runId",
  }),
}
