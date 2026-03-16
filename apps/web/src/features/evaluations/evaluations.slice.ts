import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Evaluation } from "./evaluations.models"
import { listEvaluations } from "./evaluations.thunks"

interface State {
  data: AsyncData<Evaluation[]>
}

const initialState: State = {
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "evaluations",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(listEvaluations.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listEvaluations.fulfilled, (state, action) => {
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload.sort((a, b) =>
            a.input.toString().localeCompare(b.input.toString()),
          ),
        }
      })
      .addCase(listEvaluations.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list evaluations"
      })
  },
})

export type { State as EvaluationsState }
export const evaluationsInitialState = initialState
export const evaluationsActions = { ...slice.actions }
export const evaluationsSliceReducer = slice.reducer
