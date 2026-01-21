import {
  ApiRoutes,
  type CreateChatTemplateRequestDto,
  type CreateChatTemplateResponseDto,
  type ListChatTemplatesResponseDto,
} from "@caseai-connect/api-contracts"
import type { AxiosError, AxiosInstance } from "axios"

export interface IChatTemplatesApi {
  listChatTemplates: (projectId: string) => Promise<ListChatTemplatesResponseDto>
  createChatTemplate: (
    payload: CreateChatTemplateRequestDto,
  ) => Promise<CreateChatTemplateResponseDto>
}

export const buildChatTemplatesApi = (axios: AxiosInstance): IChatTemplatesApi => ({
  listChatTemplates: async (projectId: string) => {
    try {
      const response = await axios.get<
        typeof ApiRoutes.ChatTemplatesRoutes.listChatTemplates.response
      >(
        ApiRoutes.ChatTemplatesRoutes.listChatTemplates.getPath({
          projectId,
        }),
      )
      return response.data.data
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
  createChatTemplate: async (payload: CreateChatTemplateRequestDto) => {
    try {
      const response = await axios.post<
        typeof ApiRoutes.ChatTemplatesRoutes.createChatTemplate.response
      >(ApiRoutes.ChatTemplatesRoutes.createChatTemplate.getPath(), {
        payload,
      })
      return response.data.data
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
})
