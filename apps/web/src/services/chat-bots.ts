import {
  ChatBotsRoutes,
  type CreateChatBotRequestDto,
  type CreateChatBotResponseDto,
  type ListChatBotsResponseDto,
  type UpdateChatBotRequestDto,
} from "@caseai-connect/api-contracts"
import type { AxiosError, AxiosInstance } from "axios"

export interface IChatBotsApi {
  listChatBots: (projectId: string) => Promise<ListChatBotsResponseDto>
  createChatBot: (payload: CreateChatBotRequestDto) => Promise<CreateChatBotResponseDto>
  updateChatBot: (chatBotId: string, payload: UpdateChatBotRequestDto) => Promise<void>
  deleteChatBot: (chatBotId: string) => Promise<void>
}

export const buildChatBotsApi = (axios: AxiosInstance): IChatBotsApi => ({
  listChatBots: async (projectId: string) => {
    try {
      const response = await axios.get<typeof ChatBotsRoutes.listChatBots.response>(
        ChatBotsRoutes.listChatBots.getPath({
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
      const response = await axios.post<typeof ChatBotsRoutes.createChatBot.response>(
        ChatBotsRoutes.createChatBot.getPath(),
        {
          payload,
        },
      )
      return response.data.data
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
  updateChatBot: async (chatBotId: string, payload: UpdateChatBotRequestDto) => {
    try {
      await axios.patch(ChatBotsRoutes.updateChatBot.getPath({ chatBotId }), { payload })
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
  deleteChatBot: async (chatBotId: string) => {
    try {
      await axios.delete(ChatBotsRoutes.deleteChatBot.getPath({ chatBotId }))
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
})
