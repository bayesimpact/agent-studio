import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { ChatSessionDto, ChatSessionTypeDto } from "./chat-sessions.dto"

export const ChatSessionsRoutes = {
  getAllPlayground: defineRoute<ResponseData<ChatSessionDto[]>>({
    method: "get",
    path: "chat-bots/:chatBotId/playground/sessions",
  }),
  getAllApp: defineRoute<ResponseData<ChatSessionDto[]>>({
    method: "get",
    path: "chat-bots/:chatBotId/app/sessions",
  }),
  createPlaygroundSession: defineRoute<ResponseData<ChatSessionDto>>({
    method: "post",
    path: "chat-bots/:chatBotId/playground-session",
  }),
  createAppSession: defineRoute<
    ResponseData<ChatSessionDto>,
    RequestPayload<{ chatSessionType: ChatSessionTypeDto }>
  >({
    method: "post",
    path: "chat-bots/:chatBotId/app-session",
  }),
}
