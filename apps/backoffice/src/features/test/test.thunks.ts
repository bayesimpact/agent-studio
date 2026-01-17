import type { ResponseData } from "@caseai-connect/api-contracts"
import { ProtectedRoutes } from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { selectAuthToken } from "@/features/auth/auth.selectors"
import type { RootState } from "@/store"
import { apiRequest } from "@/store/apiClient"

export const getHello = createAsyncThunk<ResponseData<string>, void, { state: RootState }>(
  "test/getHello",
  async (_, { getState }) => {
    const state = getState()
    const token = selectAuthToken(state)
    if (!token) {
      throw new Error("No authentication token available")
    }
    return apiRequest(ProtectedRoutes.getHello, undefined, token)
  },
)
