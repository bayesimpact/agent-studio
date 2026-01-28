import type { ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { CreatePlaygroundSessionResponseDto } from "./chat-sessions.dto"

export const ChatSessionsRoutes = {
  createPlaygroundSession: defineRoute<ResponseData<CreatePlaygroundSessionResponseDto>>({
    method: "post",
    path: "chat-bots/:chatBotId/playground-session",
  }),
}
