import type { MeResponseDto, ResponseData } from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const fetchMe = createAsyncThunk<ResponseData<MeResponseDto>, void, ThunkConfig>(
  "me/fetch",
  async (_, { extra }) => {
    const data = await extra.api.me.getMe()
    return { data }
  },
)
