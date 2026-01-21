import {
  ApiRoutes,
  type CreateChatBotRequestDto,
  type CreateChatBotResponseDto,
  type ListChatBotsResponseDto,
} from "@caseai-connect/api-contracts"
import type { AxiosError, AxiosInstance } from "axios"

export interface IChatBotsApi {
  listChatBots: (projectId: string) => Promise<ListChatBotsResponseDto>
  createChatBot: (payload: CreateChatBotRequestDto) => Promise<CreateChatBotResponseDto>
}

export const buildChatBotsApi = (axios: AxiosInstance): IChatBotsApi => ({
  listChatBots: async (projectId: string) => {
    try {
      const response = await axios.get<typeof ApiRoutes.ChatBotsRoutes.listChatBots.response>(
        ApiRoutes.ChatBotsRoutes.listChatBots.getPath({
          projectId,
        }),
      )
      return response.data.data
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
  createChatBot: async (payload: CreateChatBotRequestDto) => {
    try {
      const response = await axios.post<typeof ApiRoutes.ChatBotsRoutes.createChatBot.response>(
        ApiRoutes.ChatBotsRoutes.createChatBot.getPath(),
        {
          payload,
        },
      )
      return response.data.data
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
})
