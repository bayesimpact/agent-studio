import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Project } from "../projects/projects.models"
import type { Evaluation } from "./evaluations.models"
import { listEvaluations } from "./evaluations.thunks"

type DataType = Record<Project["id"], Evaluation[]> // keyed by projectId
interface State {
  data: AsyncData<DataType>
}

const initialState: State = {
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "evaluations",
  initialState,
  reducers: {
    clearEvaluations: (state, action: PayloadAction<{ projectId: string }>) => {
      // Clear evaluations for a specific project
      delete state.data.value?.[action.payload.projectId]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listEvaluations.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listEvaluations.fulfilled, (state, action) => {
        const projectId = action.payload?.[0]?.projectId
        if (!projectId) return // should not happen, but just in case
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: {
            ...state.data.value,
            [projectId]: action.payload.sort((a, b) =>
              a.input.toString().localeCompare(b.input.toString()),
            ), // sort evaluations by input
          },
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
