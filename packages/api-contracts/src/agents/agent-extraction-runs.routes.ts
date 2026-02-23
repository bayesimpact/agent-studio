import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type {
  AgentExtractionRunDto,
  ExecuteAgentExtractionRequestDto,
  ExecuteAgentExtractionResponseDto,
  ListAgentExtractionRunsResponseDto,
} from "./agent-extraction-runs.dto"

export const AgentExtractionRunsRoutes = {
  executeOne: defineRoute<
    ResponseData<ExecuteAgentExtractionResponseDto>,
    RequestPayload<ExecuteAgentExtractionRequestDto>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/extract",
  }),
  getAll: defineRoute<ResponseData<ListAgentExtractionRunsResponseDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/extraction-runs",
  }),
  getOne: defineRoute<ResponseData<AgentExtractionRunDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/extraction-runs/:runId",
  }),
}
