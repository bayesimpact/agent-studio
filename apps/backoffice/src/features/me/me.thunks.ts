import type { MeResponseDto, ResponseData } from "@caseai-connect/api-contracts"
import { MeRoutes } from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { selectAuthToken } from "@/features/auth/auth.selectors"
import type { RootState } from "@/store"
import { apiRequest } from "@/store/apiClient"

export const fetchMe = createAsyncThunk<ResponseData<MeResponseDto>, void, { state: RootState }>(
  "me/fetch",
  async (_, { getState }) => {
    const state = getState()
    const token = selectAuthToken(state)
    if (!token) {
      throw new Error("No authentication token available")
    }
    return apiRequest(MeRoutes.getMe, undefined, token)
  },
)
