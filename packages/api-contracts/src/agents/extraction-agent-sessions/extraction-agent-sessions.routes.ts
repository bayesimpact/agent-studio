import type { BaseAgentSessionTypeDto } from "../../agents/conversation-agent-sessions/conversation-agent-sessions.dto"
import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../../generic"
import { defineRoute } from "../../helpers"
import type {
  ExtractionAgentSessionDto,
  ExtractionAgentSessionResultDto,
  ExtractionAgentSessionSummaryDto,
} from "./extraction-agent-sessions.dto"

type Request<T = object> = RequestPayload<{ type: BaseAgentSessionTypeDto } & T>

export const ExtractionAgentSessionsRoutes = {
  executeOne: defineRoute<
    ResponseData<ExtractionAgentSessionResultDto>,
    Request<Pick<ExtractionAgentSessionSummaryDto, "documentId">>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/extraction-agent-sessions/execute",
  }),
  getAll: defineRoute<ResponseData<ExtractionAgentSessionSummaryDto[]>, Request>({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/extraction-agent-sessions",
  }),
  getOne: defineRoute<ResponseData<ExtractionAgentSessionDto>, Request>({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/extraction-agent-sessions/:agentSessionId/getOne",
  }),
  deleteOne: defineRoute<ResponseData<SuccessResponseDTO>, Request>({
    method: "post",
    path: "/organizations/:organizationId/projects/:projectId/agents/:agentId/extraction-agent-sessions/:agentSessionId/delete",
  }),
}
