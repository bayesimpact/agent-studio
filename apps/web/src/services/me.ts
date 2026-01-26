import { ApiRoutes, type MeResponseDto } from "@caseai-connect/api-contracts"
import type { AxiosError, AxiosInstance } from "axios"

export interface IMeApi {
  getMe: () => Promise<MeResponseDto>
}

export const buildMeApi = (axios: AxiosInstance): IMeApi => ({
  getMe: async () => {
    try {
      const response = await axios.get<typeof ApiRoutes.MeRoutes.getMe.response>(
        ApiRoutes.MeRoutes.getMe.getPath(),
      )
      return response.data.data
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
})
