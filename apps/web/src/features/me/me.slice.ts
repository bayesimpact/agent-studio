import { createSlice } from "@reduxjs/toolkit"
import { fetchMe } from "./me.thunks"

interface MeState {
  user: {
    id: string
    email: string
    name: string | null
  } | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: MeState = {
  user: null,
  status: "idle",
  error: null,
}

export const meSlice = createSlice({
  name: "me",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.user = action.payload.data.user
        state.error = null
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to fetch user data"
      })
  },
})
