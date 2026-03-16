import { createSlice } from "@reduxjs/toolkit"
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
    reset: () => initialState,
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
    builder.addCase(createEvaluationReport.pending, (state, action) => {
      const evaluationId = action.meta.arg.evaluationId

      // Optimistically add a placeholder report to the state for immediate UI feedback
      state.data.status = ADS.Fulfilled
      state.data.error = null
      state.data.value = {
        ...state.data.value,
        [evaluationId]: [
          ...(state.data.value?.[evaluationId] || []),
          {
            id: "temp-id", // temp ID for optimistic update
            evaluationId,
            // biome-ignore lint/complexity/useDateNow: number is expected here
            createdAt: new Date().getTime(),
            agentId: action.meta.arg.agentId,
            traceUrl: "",
            output: "",
            score: "",
            updatedAt: undefined,
          },
        ],
      }
    })
  },
})

export type { State as EvaluationReportsState }
export const evaluationReportsInitialState = initialState
export const evaluationReportsActions = { ...slice.actions }
export const evaluationReportsSliceReducer = slice.reducer
