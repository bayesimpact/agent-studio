import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Evaluation } from "../evaluations/evaluations.models"
import type { EvaluationReport } from "./evaluation-reports.models"
import { createEvaluationReport, listEvaluationReports } from "./evaluation-reports.thunks"

type DataType = Record<Evaluation["id"], EvaluationReport[]> // keyed by evaluationId
interface State {
  data: AsyncData<DataType>
}

const initialState: State = {
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "evaluationReports",
  initialState,
  reducers: {
    clearEvaluationReports: (state, action: PayloadAction<{ evaluationId: string }>) => {
      // Clear reports for a specific evaluation
      delete state.data.value?.[action.payload.evaluationId]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listEvaluationReports.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listEvaluationReports.fulfilled, (state, action) => {
        const evaluationId = action.meta.arg.evaluationId
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: {
            ...state.data.value,
            [evaluationId]: action.payload.sort(
              (a: EvaluationReport, b: EvaluationReport) => a.createdAt - b.createdAt,
            ), // sort by createdAt ascending (oldest first)
          },
        }
      })
      .addCase(listEvaluationReports.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list evaluation reports"
      })
      .addCase(createEvaluationReport.fulfilled, (state, action) => {
        const evaluationId = action.payload.evaluationId
        if (ADS.isFulfilled(state.data) && state.data.value?.[evaluationId]) {
          state.data.value[evaluationId] = [action.payload, ...state.data.value[evaluationId]]
        }
      })
  },
})

export type { State as EvaluationReportsState }
export const evaluationReportsInitialState = initialState
export const evaluationReportsActions = { ...slice.actions }
export const evaluationReportsSliceReducer = slice.reducer
