import {
  type CreateOrganizationRequestDto,
  type CreateOrganizationResponseDto,
  OrganizationsRoutes,
} from "@caseai-connect/api-contracts"
import type { AxiosError, AxiosInstance } from "axios"

export interface IOrganizationsApi {
  createOrganization: (
    payload: CreateOrganizationRequestDto,
  ) => Promise<CreateOrganizationResponseDto>
}

export const buildOrganizationsApi = (axios: AxiosInstance): IOrganizationsApi => ({
  createOrganization: async (payload: CreateOrganizationRequestDto) => {
    try {
      const response = await axios.post<typeof OrganizationsRoutes.createOrganization.response>(
        OrganizationsRoutes.createOrganization.getPath(),
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
