import { type MeResponseDto, MeRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { Me } from "../me.models"
import type { IMeSpi } from "../me.spi"

export default {
  getMe: async () => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof MeRoutes.getMe.response>(MeRoutes.getMe.getPath())
    return fromDto(response.data.data)
  },
} satisfies IMeSpi

const fromDto = (dto: MeResponseDto): Me => ({
  user: {
    id: dto.user.id,
    email: dto.user.email,
    name: dto.user.name || "Unknown User Name",
    // FIXME: temporary hardcode until we have proper roles
    admin: false,
  },
  organizations: dto.organizations,
})
