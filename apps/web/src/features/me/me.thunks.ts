import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { Me } from "./me.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const fetchMe = createAsyncThunk<Me, void, ThunkConfig>(
  "me/fetch",
  async (_, { extra: { services } }) => await services.me.getMe(),
)
