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
    await axios.post<typeof ChatBotsRoutes.createOne.response>(
      ChatBotsRoutes.createOne.getPath(params),
      {
        payload: toCreateDto(payload),
      },
    )
    return
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
  payload: Pick<ChatBot, "name" | "defaultPrompt">,
): (typeof ChatBotsRoutes.createOne.request)["payload"] => ({
  name: payload.name,
  defaultPrompt: payload.defaultPrompt,
})

const toUpdateDto = (
  payload: Partial<Pick<ChatBot, "name" | "defaultPrompt">>,
): (typeof ChatBotsRoutes.updateOne.request)["payload"] => ({
  name: payload.name,
  defaultPrompt: payload.defaultPrompt,
})

const fromChatBotDto = (dto: ChatBotDto): ChatBot => ({
  id: dto.id,
  name: dto.name,
  defaultPrompt: dto.defaultPrompt,
  projectId: dto.projectId,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
})
