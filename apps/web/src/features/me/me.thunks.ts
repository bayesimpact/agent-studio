import { createAsyncThunk } from "@reduxjs/toolkit"
import { isAxiosError } from "axios"
import type { RootState, ThunkExtraArg } from "@/store"
import type { Me } from "./me.models"

type FetchMeRejectedValue = {
  status?: number
}

type ThunkConfig = {
  state: RootState
  extra: ThunkExtraArg
  rejectValue: FetchMeRejectedValue
}

export const fetchMe = createAsyncThunk<Me, void, ThunkConfig>(
  "me/fetch",
  async (_, { extra: { services }, rejectWithValue }) => {
    try {
      return await services.me.getMe()
    } catch (error) {
      if (isAxiosError(error)) {
        return rejectWithValue({ status: error.response?.status })
      }
      throw error
    }
  },
)
