import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Me } from "./me.models"
import { fetchMe } from "./me.thunks"

interface State {
  data: AsyncData<Me["user"]>
}

const initialState: State = {
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "me",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload.user,
        }
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to fetch user data"
      })
  },
})

export type { State as MeState }
export const meInitialState = initialState
export const meActions = { ...slice.actions }
export const meSliceReducer = slice.reducer
