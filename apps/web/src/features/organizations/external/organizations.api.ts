import {
  type CreateOrganizationResponseDto,
  OrganizationsRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { Organization } from "../organizations.models"
import type { IOrganizationsSpi } from "../organizations.spi"

export default {
  createOrganization: async (payload: { name: string }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof OrganizationsRoutes.createOrganization.response>(
      OrganizationsRoutes.createOrganization.getPath(),
      {
        payload,
      },
    )
    return fromDto(response.data.data)
  },
} satisfies IOrganizationsSpi

const fromDto = (dto: CreateOrganizationResponseDto): Organization => ({
  id: dto.id,
  name: dto.name,
  role: dto.role,
})
