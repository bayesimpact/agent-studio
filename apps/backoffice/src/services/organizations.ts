import {
  ApiRoutes,
  type CreateOrganizationRequestDto,
  type CreateOrganizationResponseDto,
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
      const response = await axios.post<
        typeof ApiRoutes.OrganizationsRoutes.createOrganization.response
      >(ApiRoutes.OrganizationsRoutes.createOrganization.getPath(), {
        payload,
      })
      return response.data.data
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
})
