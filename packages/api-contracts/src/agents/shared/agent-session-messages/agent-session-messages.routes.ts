import type { RequestPayload, ResponseData } from "../../../generic"
import { defineRoute } from "../../../helpers"
import type { BaseAgentSessionTypeDto } from "../../conversation-agent-sessions/conversation-agent-sessions.dto"
import type {
  AgentSessionMessageDto,
  PresignAgentSessionMessageAttachmentDocumentRequestDto,
  PresignAgentSessionMessageAttachmentDocumentResponseDto,
} from "./agent-session-messages.dto"

// Streaming responses are sent as text/event-stream (SSE) and do not follow the usual ResponseData<T> shape.
// We still define a route for path/method typing. The response type is treated as unknown by clients.
export type AgentSessionStreamResponse = unknown

const basePath =
  "organizations/:organizationId/projects/:projectId/agents/:agentId/agent-sessions/:agentSessionId"
export const AgentSessionMessagesRoutes = {
  getAll: defineRoute<
    ResponseData<AgentSessionMessageDto[]>,
    RequestPayload<{ type: BaseAgentSessionTypeDto }>
  >({
    method: "post",
    path: `${basePath}/messages`,
  }),
  getOne: defineRoute<
    ResponseData<AgentSessionMessageDto>,
    RequestPayload<{ type: BaseAgentSessionTypeDto }>
  >({
    method: "post",
    path: `${basePath}/messages/:messageId`,
  }),
  presignAttachmentDocument: defineRoute<
    ResponseData<PresignAgentSessionMessageAttachmentDocumentResponseDto>,
    RequestPayload<
      { type: BaseAgentSessionTypeDto } & PresignAgentSessionMessageAttachmentDocumentRequestDto
    >
  >({
    method: "post",
    path: `${basePath}/messages/attachment-document/presign`,
  }),
  getAttachmentDocumentTemporaryUrl: defineRoute<
    ResponseData<{ url: string }>,
    RequestPayload<{ type: BaseAgentSessionTypeDto }>
  >({
    method: "post",
    path: `${basePath}/messages/attachment-document/:attachmentDocumentId/temporary-url`,
  }),
  stream: defineRoute<
    ResponseData<AgentSessionStreamResponse>,
    RequestPayload<{ content: string; attachmentDocumentId?: string }>
  >({
    method: "post",
    path: `${basePath}/stream`,
  }),
}
