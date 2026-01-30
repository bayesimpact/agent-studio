import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { ChatSessionDto, ChatSessionTypeDto } from "./chat-sessions.dto"

export const ChatSessionsRoutes = {
  createPlaygroundSession: defineRoute<ResponseData<ChatSessionDto>>({
    method: "post",
    path: "chat-bots/:chatBotId/playground-session",
  }),
  createEndUserSession: defineRoute<
    ResponseData<ChatSessionDto>,
    RequestPayload<{ chatSessionType: ChatSessionTypeDto }>
  >({
    method: "post",
    path: "chat-bots/:chatBotId/end-user-session",
  }),
}
