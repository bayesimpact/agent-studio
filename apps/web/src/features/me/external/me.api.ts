import { type MeResponseDto, MeRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import { toOrganization } from "../../organizations/external/organizations.api"
import type { Me } from "../me.models"
import type { IMeSpi } from "../me.spi"

export default {
  getMe: async () => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof MeRoutes.getMe.response>(MeRoutes.getMe.getPath())
    return toMe(response.data.data)
  },
} satisfies IMeSpi

const toMe = (dto: MeResponseDto): Me => ({
  user: { id: dto.user.id, email: dto.user.email, name: dto.user.name || "Unknown User Name" },
  organizations: dto.organizations.map(toOrganization),
})
