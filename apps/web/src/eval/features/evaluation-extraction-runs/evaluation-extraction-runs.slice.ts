import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/common/store/async-data-status"
import type {
  EvaluationExtractionRun,
  EvaluationExtractionRunRecord,
  EvaluationExtractionRunStatus,
  EvaluationExtractionRunSummary,
} from "./evaluation-extraction-runs.models"
import { evaluationExtractionRunsThunks } from "./evaluation-extraction-runs.thunks"

interface State {
  currentRunId: string | null
  data: AsyncData<EvaluationExtractionRun[]>
  currentRun: AsyncData<EvaluationExtractionRun>
  currentRunRecords: AsyncData<EvaluationExtractionRunRecord[]>
  isExecuting: boolean
  runStatusStream: { isActive: boolean }
}

const initialState: State = {
  currentRunId: null,
  data: defaultAsyncData,
  currentRun: defaultAsyncData,
  currentRunRecords: defaultAsyncData,
  isExecuting: false,
  runStatusStream: { isActive: false },
}

const slice = createSlice({
  name: "extractionRuns",
  initialState,
  reducers: {
    reset: () => initialState,
    setCurrentRunId: (state, action: PayloadAction<{ runId: string | null }>) => {
      state.currentRunId = action.payload.runId
    },
    startRunStatusStream: (state) => {
      state.runStatusStream.isActive = true
    },
    stopRunStatusStream: (state) => {
      state.runStatusStream.isActive = false
    },
    patchRunStatus: (
      state,
      action: PayloadAction<{
        evaluationExtractionRunId: string
        status: EvaluationExtractionRunStatus
        summary: EvaluationExtractionRunSummary | null
        updatedAt: number
      }>,
    ) => {
      const { evaluationExtractionRunId, status, summary, updatedAt } = action.payload

      // Patch current run if it matches
      if (
        ADS.isFulfilled(state.currentRun) &&
        state.currentRun.value.id === evaluationExtractionRunId
      ) {
        state.currentRun.value.status = status
        state.currentRun.value.summary = summary
        state.currentRun.value.updatedAt = updatedAt
      }

      // Patch run in the list if it matches
      if (ADS.isFulfilled(state.data)) {
        const runInList = state.data.value.find((run) => run.id === evaluationExtractionRunId)
        if (runInList) {
          runInList.status = status
          runInList.summary = summary
          runInList.updatedAt = updatedAt
        }
      }
    },
  },
  extraReducers: (builder) => {
    // getAll
    builder
      .addCase(evaluationExtractionRunsThunks.getAll.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(evaluationExtractionRunsThunks.getAll.fulfilled, (state, action) => {
        state.data = { status: ADS.Fulfilled, error: null, value: action.payload }
      })
      .addCase(evaluationExtractionRunsThunks.getAll.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list evaluation runs"
      })

    // getOne
    builder
      .addCase(evaluationExtractionRunsThunks.getOne.pending, (state) => {
        if (!ADS.isFulfilled(state.currentRun)) state.currentRun.status = ADS.Loading
        state.currentRun.error = null
      })
      .addCase(evaluationExtractionRunsThunks.getOne.fulfilled, (state, action) => {
        state.currentRun = { status: ADS.Fulfilled, error: null, value: action.payload }
      })
      .addCase(evaluationExtractionRunsThunks.getOne.rejected, (state, action) => {
        state.currentRun.status = ADS.Error
        state.currentRun.error = action.error.message || "Failed to get evaluation run"
      })

    // getRecords
    builder
      .addCase(evaluationExtractionRunsThunks.getRecords.pending, (state) => {
        if (!ADS.isFulfilled(state.currentRunRecords)) state.currentRunRecords.status = ADS.Loading
        state.currentRunRecords.error = null
      })
      .addCase(evaluationExtractionRunsThunks.getRecords.fulfilled, (state, action) => {
        state.currentRunRecords = { status: ADS.Fulfilled, error: null, value: action.payload }
      })
      .addCase(evaluationExtractionRunsThunks.getRecords.rejected, (state, action) => {
        state.currentRunRecords.status = ADS.Error
        state.currentRunRecords.error = action.error.message || "Failed to get run records"
      })

    // createAndExecute
    builder
      .addCase(evaluationExtractionRunsThunks.createAndExecute.pending, (state) => {
        state.isExecuting = true
      })
      .addCase(evaluationExtractionRunsThunks.createAndExecute.fulfilled, (state, action) => {
        state.isExecuting = false
        state.currentRun = { status: ADS.Fulfilled, error: null, value: action.payload }
        state.currentRunId = action.payload.id
      })
      .addCase(evaluationExtractionRunsThunks.createAndExecute.rejected, (state) => {
        state.isExecuting = false
      })
  },
})

export type { State as EvaluationExtractionRunsState }
export const evaluationExtractionRunsInitialState = initialState
export const evaluationExtractionRunsActions = {
  ...slice.actions,
  ...evaluationExtractionRunsThunks,
}
export const evaluationExtractionRunsSlice = slice
