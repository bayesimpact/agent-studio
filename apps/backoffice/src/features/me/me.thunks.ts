import type { MeResponseDto, ResponseData } from "@caseai-connect/api-contracts"
import { MeRoutes } from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { apiRequestWithAuth } from "@/services/apiClientWithAuth"
import type { RootState } from "@/store"

export const fetchMe = createAsyncThunk<ResponseData<MeResponseDto>, void, { state: RootState }>(
  "me/fetch",
  async () => {
    return apiRequestWithAuth({ route: MeRoutes.getMe })
  },
)
