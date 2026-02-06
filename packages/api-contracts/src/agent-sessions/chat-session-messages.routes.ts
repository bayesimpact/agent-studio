import type { ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { ListChatSessionMessagesResponseDto } from "./agent-session-messages.dto"

export const ChatSessionMessagesRoutes = {
  listMessages: defineRoute<ResponseData<ListChatSessionMessagesResponseDto>>({
    method: "get",
    path: "chat-sessions/:sessionId/messages",
  }),
}
