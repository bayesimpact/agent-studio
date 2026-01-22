import type {
  CreateOrganizationRequestDto,
  CreateOrganizationResponseDto,
  ResponseData,
} from "@caseai-connect/api-contracts"
import { OrganizationsRoutes } from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { apiRequestWithAuth } from "@/services/apiClientWithAuth"
import type { RootState } from "@/store"

export const createOrganization = createAsyncThunk<
  ResponseData<CreateOrganizationResponseDto>,
  CreateOrganizationRequestDto,
  { state: RootState }
>("organizations/create", async (payload) => {
  return apiRequestWithAuth({
    route: OrganizationsRoutes.createOrganization,
    payload: { payload },
  })
})
