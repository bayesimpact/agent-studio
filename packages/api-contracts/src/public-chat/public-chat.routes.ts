import type { EmbedPublicConfigDto } from "../agent-embed-configs/agent-embed-configs.dto"
import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type {
  CreatePublicSessionRequestDto,
  CreatePublicSessionResponseDto,
  PublicAgentSessionDto,
} from "./public-chat.dto"

// SSE streaming responses do not follow the usual ResponseData<T> shape.
export type PublicChatStreamResponse = unknown

/**
 * Namespace for endpoints callable from arbitrary host pages (embed widget).
 * The API selects its open CORS policy on this prefix (ADR 0015), and their
 * security is enforced by EmbedTokenGuard, not by CORS. Renaming it breaks
 * deployed embed snippets.
 */
export const PUBLIC_PATH_PREFIX = "public"

const agentBasePath = `${PUBLIC_PATH_PREFIX}/agents/:embedToken`
const sessionBasePath = `${agentBasePath}/sessions/:sessionId`

export const PublicChatRoutes = {
  getConfig: defineRoute<ResponseData<EmbedPublicConfigDto>>({
    method: "get",
    path: `${agentBasePath}/config`,
  }),

  createSession: defineRoute<
    ResponseData<CreatePublicSessionResponseDto>,
    RequestPayload<CreatePublicSessionRequestDto>
  >({
    method: "post",
    path: `${agentBasePath}/sessions`,
  }),

  getSession: defineRoute<ResponseData<PublicAgentSessionDto>>({
    method: "get",
    path: sessionBasePath,
  }),

  streamMessages: defineRoute<
    ResponseData<PublicChatStreamResponse>,
    RequestPayload<{ content: string }>
  >({
    method: "post",
    path: `${sessionBasePath}/messages/stream`,
  }),
}
