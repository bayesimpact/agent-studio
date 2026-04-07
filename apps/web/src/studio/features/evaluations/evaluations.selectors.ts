import type { RootState } from "@/store"

export const selectEvaluationsStatus = (state: RootState) => state.studio.evaluations.data.status

export const selectEvaluationsError = (state: RootState) => state.studio.evaluations.data.error

export const selectEvaluationsData = (state: RootState) => state.studio.evaluations.data
