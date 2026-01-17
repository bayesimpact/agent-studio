import { ProtectedRoutes } from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { selectAuthToken } from "@/features/auth/auth.selectors"
import type { RootState } from "@/store"
import { apiRequest } from "@/store/apiClient"

export const getHello = createAsyncThunk("test/getHello", async (_, { getState }) => {
  const state = getState() as RootState
  const token = selectAuthToken(state)
  if (!token) {
    throw new Error("No authentication token available")
  }
  return apiRequest(ProtectedRoutes.getHello, undefined, token)
})
