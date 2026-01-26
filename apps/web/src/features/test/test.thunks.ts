import type { ResponseData } from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const getHello = createAsyncThunk<ResponseData<string>, void, ThunkConfig>(
  "test/getHello",
  async (_, { extra }) => {
    const data = await extra.services.test.getHello()
    return { data }
  },
)
