import { type ChatBotDto, ChatBotsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { ChatBot } from "../chat-bots.models"
import type { IChatBotsSpi } from "../chat-bots.spi"

export default {
  getAll: async (params) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ChatBotsRoutes.getAll.response>(
      ChatBotsRoutes.getAll.getPath(params),
    )
    return response.data.data.chatBots.map(fromChatBotDto)
  },
  createOne: async (params, payload) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ChatBotsRoutes.createOne.response>(
      ChatBotsRoutes.createOne.getPath(params),
      { payload: toCreateDto(payload) },
    )
    return fromChatBotDto(response.data.data)
  },
  updateOne: async (params, payload) => {
    const axios = getAxiosInstance()
    await axios.patch(ChatBotsRoutes.updateOne.getPath(params), {
      payload: toUpdateDto(payload),
    })
  },
  deleteOne: async (params) => {
    const axios = getAxiosInstance()
    await axios.delete(ChatBotsRoutes.deleteOne.getPath(params))
  },
} satisfies IChatBotsSpi

const toCreateDto = (
  payload: Pick<ChatBot, "name" | "defaultPrompt" | "model" | "locale" | "temperature">,
): (typeof ChatBotsRoutes.createOne.request)["payload"] => ({
  defaultPrompt: payload.defaultPrompt,
  locale: payload.locale,
  model: payload.model,
  name: payload.name,
  temperature: payload.temperature,
})

const toUpdateDto = (
  payload: Partial<Pick<ChatBot, "name" | "defaultPrompt" | "locale" | "model" | "temperature">>,
): (typeof ChatBotsRoutes.updateOne.request)["payload"] => ({
  defaultPrompt: payload.defaultPrompt,
  locale: payload.locale,
  model: payload.model,
  name: payload.name,
  temperature: payload.temperature,
})

const fromChatBotDto = (dto: ChatBotDto): ChatBot => ({
  createdAt: dto.createdAt,
  defaultPrompt: dto.defaultPrompt,
  id: dto.id,
  locale: dto.locale,
  model: dto.model,
  name: dto.name,
  projectId: dto.projectId,
  temperature: dto.temperature,
  updatedAt: dto.updatedAt,
})
