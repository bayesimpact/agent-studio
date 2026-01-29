import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type { ChatBotDto, ListChatBotsResponseDto } from "./chat-bots.dto"

export const ChatBotsRoutes = {
  createOne: defineRoute<
    ResponseData<SuccessResponseDTO>,
    RequestPayload<Pick<ChatBotDto, "name" | "defaultPrompt">>
  >({
    method: "post",
    path: "projects/:projectId/chat-bots",
  }),
  getAll: defineRoute<ResponseData<ListChatBotsResponseDto>>({
    method: "get",
    path: "projects/:projectId/chat-bots",
  }),
  updateOne: defineRoute<
    ResponseData<SuccessResponseDTO>,
    RequestPayload<Partial<Pick<ChatBotDto, "name" | "defaultPrompt">>>
  >({
    method: "patch",
    path: "projects/:projectId/chat-bots/:chatBotId",
  }),
  deleteOne: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "projects/:projectId/chat-bots/:chatBotId",
  }),
}
