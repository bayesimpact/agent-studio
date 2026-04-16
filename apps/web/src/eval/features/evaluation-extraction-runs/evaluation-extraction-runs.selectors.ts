import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/common/store"
import { ADS, type AsyncData } from "@/common/store/async-data-status"
import type { EvaluationExtractionRun } from "./evaluation-extraction-runs.models"

export const selectEvaluationExtractionRunsData = (state: RootState) =>
  state.evaluation.extractionRuns.data

export const selectCurrentRunId = (state: RootState) => state.evaluation.extractionRuns.currentRunId

export const selectCurrentRunData = (state: RootState) => state.evaluation.extractionRuns.currentRun

export const selectCurrentRunRecords = (state: RootState) =>
  state.evaluation.extractionRuns.currentRunRecords

export const selectIsExecuting = (state: RootState) => state.evaluation.extractionRuns.isExecuting

export const selectRunsForDataset = createSelector(
  [selectEvaluationExtractionRunsData, (_state: RootState, datasetId: string) => datasetId],
  (runsData, datasetId): AsyncData<EvaluationExtractionRun[]> => {
    if (ADS.isFulfilled(runsData)) {
      const filtered = runsData.value.filter(
        (run) => run.evaluationExtractionDatasetId === datasetId,
      )
      return { status: ADS.Fulfilled, error: null, value: filtered }
    }
    return runsData
  },
)
