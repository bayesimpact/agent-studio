import type { ResponseData } from "@caseai-connect/api-contracts"
import { ProtectedRoutes } from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { apiRequestWithAuth } from "@/services/apiClientWithAuth"
import type { RootState } from "@/store"

export const getHello = createAsyncThunk<ResponseData<string>, void, { state: RootState }>(
  "test/getHello",
  async () => {
    return apiRequestWithAuth({ route: ProtectedRoutes.getHello })
  },
)
