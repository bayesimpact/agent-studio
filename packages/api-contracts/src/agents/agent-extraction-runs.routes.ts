import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type {
  AgentExtractionRunDto,
  ExecuteAgentExtractionRequestDto,
  ExecuteAgentExtractionResponseDto,
  ListAgentExtractionRunsResponseDto,
} from "./agent-extraction-runs.dto"

export const AgentExtractionRunsRoutes = {
  executePlaygroundOne: defineRoute<
    ResponseData<ExecuteAgentExtractionResponseDto>,
    RequestPayload<ExecuteAgentExtractionRequestDto>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/playground/extract",
  }),
  executeLiveOne: defineRoute<
    ResponseData<ExecuteAgentExtractionResponseDto>,
    RequestPayload<ExecuteAgentExtractionRequestDto>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/live/extract",
  }),
  getAllPlayground: defineRoute<ResponseData<ListAgentExtractionRunsResponseDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/playground/extraction-runs",
  }),
  getAllLive: defineRoute<ResponseData<ListAgentExtractionRunsResponseDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/live/extraction-runs",
  }),
  getOnePlayground: defineRoute<ResponseData<AgentExtractionRunDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/playground/extraction-runs/:runId",
  }),
  getOneLive: defineRoute<ResponseData<AgentExtractionRunDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/live/extraction-runs/:runId",
  }),
}
