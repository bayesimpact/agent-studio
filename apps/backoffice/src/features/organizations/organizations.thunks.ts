import type {
  CreateOrganizationRequestDto,
  CreateOrganizationResponseDto,
  ResponseData,
} from "@caseai-connect/api-contracts"
import { OrganizationsRoutes } from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { selectAuthToken } from "@/features/auth/auth.selectors"
import type { RootState } from "@/store"
import { apiRequest } from "@/store/apiClient"

export const createOrganization = createAsyncThunk<
  ResponseData<CreateOrganizationResponseDto>,
  CreateOrganizationRequestDto,
  { state: RootState }
>("organizations/create", async (payload, { getState }) => {
  const state = getState()
  const token = selectAuthToken(state)
  if (!token) {
    throw new Error("No authentication token available")
  }
  return apiRequest({ route: OrganizationsRoutes.createOrganization, payload: { payload }, token })
})
