import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type {
  CreateChatBotRequestDto,
  CreateChatBotResponseDto,
  ListChatBotsResponseDto,
  UpdateChatBotRequestDto,
  UpdateChatBotResponseDto,
} from "./dto/chat-bots.dto"

export const ChatBotsRoutes = {
  createChatBot: defineRoute<
    ResponseData<CreateChatBotResponseDto>,
    RequestPayload<CreateChatBotRequestDto>
  >({
    method: "post",
    path: "chat-bots",
  }),
  listChatBots: defineRoute<ResponseData<ListChatBotsResponseDto>>({
    method: "get",
    path: "projects/:projectId/chat-bots",
  }),
  updateChatBot: defineRoute<
    ResponseData<UpdateChatBotResponseDto>,
    RequestPayload<UpdateChatBotRequestDto>
  >({
    method: "patch",
    path: "chat-bots/:chatBotId",
  }),
  deleteChatBot: defineRoute<ResponseData<{ success: boolean }>>({
    method: "delete",
    path: "chat-bots/:chatBotId",
  }),
}
