import {
  ChatBotsRoutes,
  type CreateChatBotRequestDto,
  type CreateChatBotResponseDto,
  type ListChatBotsResponseDto,
  type UpdateChatBotRequestDto,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { ChatBot, CreateChatBotPayload, UpdateChatBotPayload } from "../chat-bots.models"
import type { IChatBotsSpi } from "../chat-bots.spi"

export default {
  getAll: async (projectId: string) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ChatBotsRoutes.listChatBots.response>(
      ChatBotsRoutes.listChatBots.getPath({ projectId }),
    )
    return fromListDto(response.data.data)
  },
  createOne: async (payload: CreateChatBotPayload) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ChatBotsRoutes.createChatBot.response>(
      ChatBotsRoutes.createChatBot.getPath(),
      {
        payload: toCreateDto(payload),
      },
    )
    return fromCreateDto(response.data.data)
  },
  updateOne: async (chatBotId: string, payload: UpdateChatBotPayload) => {
    const axios = getAxiosInstance()
    await axios.patch(ChatBotsRoutes.updateChatBot.getPath({ chatBotId }), {
      payload: toUpdateDto(payload),
    })
  },
  deleteOne: async (chatBotId: string) => {
    const axios = getAxiosInstance()
    await axios.delete(ChatBotsRoutes.deleteChatBot.getPath({ chatBotId }))
  },
} satisfies IChatBotsSpi

const toCreateDto = (payload: CreateChatBotPayload): CreateChatBotRequestDto => ({
  name: payload.name,
  defaultPrompt: payload.defaultPrompt,
  projectId: payload.projectId,
})

const toUpdateDto = (payload: UpdateChatBotPayload): UpdateChatBotRequestDto => ({
  name: payload.name,
  defaultPrompt: payload.defaultPrompt,
})

const fromCreateDto = (dto: CreateChatBotResponseDto): ChatBot => ({
  id: dto.id,
  name: dto.name,
  defaultPrompt: dto.defaultPrompt,
  projectId: dto.projectId,
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

const fromListDto = (dto: ListChatBotsResponseDto): ChatBot[] =>
  dto.chatBots.map((chatBot) => ({
    id: chatBot.id,
    name: chatBot.name,
    defaultPrompt: chatBot.defaultPrompt,
    projectId: chatBot.projectId,
    createdAt: chatBot.createdAt,
    updatedAt: chatBot.updatedAt,
  }))
