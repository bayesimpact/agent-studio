import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type {
  CreateChatTemplateRequestDto,
  CreateChatTemplateResponseDto,
} from "./dto/create-chat-template.dto"
import type { ListChatTemplatesResponseDto } from "./dto/list-chat-templates.dto"
import type {
  UpdateChatTemplateRequestDto,
  UpdateChatTemplateResponseDto,
} from "./dto/update-chat-template.dto"

export const ChatTemplatesRoutes = {
  createChatTemplate: defineRoute<
    ResponseData<CreateChatTemplateResponseDto>,
    RequestPayload<CreateChatTemplateRequestDto>
  >({
    method: "post",
    path: "chat-templates",
  }),
  listChatTemplates: defineRoute<ResponseData<ListChatTemplatesResponseDto>>({
    method: "get",
    path: "projects/:projectId/chat-templates",
  }),
  updateChatTemplate: defineRoute<
    ResponseData<UpdateChatTemplateResponseDto>,
    RequestPayload<UpdateChatTemplateRequestDto>
  >({
    method: "patch",
    path: "chat-templates/:chatTemplateId",
  }),
  deleteChatTemplate: defineRoute<ResponseData<{ success: boolean }>>({
    method: "delete",
    path: "chat-templates/:chatTemplateId",
  }),
}
