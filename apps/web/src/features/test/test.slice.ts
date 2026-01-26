import { createSlice } from "@reduxjs/toolkit"
import { getHello } from "./test.thunks"

interface TestState {
  helloMessage: string | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: TestState = {
  helloMessage: null,
  status: "idle",
  error: null,
}

export const testSlice = createSlice({
  name: "test",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getHello.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(getHello.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.helloMessage = action.payload.data
        state.error = null
      })
      .addCase(getHello.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to get hello message"
      })
  },
})
