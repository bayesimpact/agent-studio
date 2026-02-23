import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import { selectCurrentProjectId } from "../projects/projects.selectors"
import type { Evaluation } from "./evaluations.models"

export const selectEvaluationsStatus = (state: RootState) => state.evaluations.data.status

export const selectEvaluationsError = (state: RootState) => state.evaluations.data.error

export const selectEvaluationsData = (state: RootState) => state.evaluations.data

const missingProjectId = { status: ADS.Error, value: null, error: "No project selected" }
const missingEvaluations = { status: ADS.Error, value: null, error: "No evaluations available" }

export const selectCurrentEvaluationsData = createSelector(
  [selectCurrentProjectId, selectEvaluationsData],
  (projectId, evaluationsData): AsyncData<Evaluation[]> => {
    if (!projectId) return missingProjectId

    if (!ADS.isFulfilled(evaluationsData)) return { ...evaluationsData }

    if (!evaluationsData.value?.[projectId]) return missingEvaluations

    return { status: ADS.Fulfilled, value: evaluationsData.value[projectId], error: null }
  },
)
