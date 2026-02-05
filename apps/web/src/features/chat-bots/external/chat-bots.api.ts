import { type AgentDto, AgentsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { ChatBot } from "../chat-bots.models"
import type { IChatBotsSpi } from "../chat-bots.spi"

export default {
  getAll: async (params) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AgentsRoutes.getAll.response>(
      AgentsRoutes.getAll.getPath(params),
    )
    return response.data.data.agents.map(fromChatBotDto)
  },
  createOne: async (params, payload) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof AgentsRoutes.createOne.response>(
      AgentsRoutes.createOne.getPath(params),
      { payload: toCreateDto(payload) },
    )
    return fromChatBotDto(response.data.data)
  },
  updateOne: async (params, payload) => {
    const axios = getAxiosInstance()
    await axios.patch(AgentsRoutes.updateOne.getPath(params), {
      payload: toUpdateDto(payload),
    })
  },
  deleteOne: async (params) => {
    const axios = getAxiosInstance()
    await axios.delete(AgentsRoutes.deleteOne.getPath(params))
  },
} satisfies IChatBotsSpi

const toCreateDto = (
  payload: Pick<ChatBot, "name" | "defaultPrompt" | "model" | "locale" | "temperature">,
): (typeof AgentsRoutes.createOne.request)["payload"] => ({
  defaultPrompt: payload.defaultPrompt,
  locale: payload.locale,
  model: payload.model,
  name: payload.name,
  temperature: payload.temperature,
})

const toUpdateDto = (
  payload: Partial<Pick<ChatBot, "name" | "defaultPrompt" | "locale" | "model" | "temperature">>,
): (typeof AgentsRoutes.updateOne.request)["payload"] => ({
  defaultPrompt: payload.defaultPrompt,
  locale: payload.locale,
  model: payload.model,
  name: payload.name,
  temperature: payload.temperature,
})

const fromChatBotDto = (dto: AgentDto): ChatBot => ({
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
