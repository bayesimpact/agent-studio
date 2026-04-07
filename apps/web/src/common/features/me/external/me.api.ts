import { type MeResponseDto, MeRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import { toOrganization } from "@/features/organizations/external/organizations.api"
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
  user: {
    id: dto.user.id,
    email: dto.user.email,
    name: dto.user.name || dto.user.email.split("@")[0]?.replaceAll(".", " ") || "Unnamed User",
    memberships: dto.user.memberships,
  },
  organizations: dto.organizations.map(toOrganization),
})
