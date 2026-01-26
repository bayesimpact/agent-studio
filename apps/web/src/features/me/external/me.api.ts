import { type MeResponseDto, MeRoutes } from "@caseai-connect/api-contracts"
import type { AxiosError, AxiosInstance } from "axios"
import type { Me } from "../me.models"
import type { IMeSpi } from "../me.spi"

// TODO: use axios singleton instead of passing it here
export const buildMeApi = (axios: AxiosInstance): IMeSpi => ({
  getMe: async () => {
    try {
      const response = await axios.get<typeof MeRoutes.getMe.response>(MeRoutes.getMe.getPath())
      return fromDto(response.data.data)
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
})

const fromDto = (dto: MeResponseDto): Me => ({
  user: dto.user,
  organizations: dto.organizations,
})
