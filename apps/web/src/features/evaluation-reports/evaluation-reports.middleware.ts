import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { listEvaluations } from "../evaluations/evaluations.thunks"
import { notificationsActions } from "../notifications/notifications.slice"
import { createEvaluationReport, listEvaluationReports } from "./evaluation-reports.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

// Refresh evaluation reports when listEvaluations is fulfilled
listenerMiddleware.startListening({
  actionCreator: listEvaluations.fulfilled,
  effect: async (action, listenerApi) => {
    action.payload.forEach(async (evaluation) => {
      await listenerApi.dispatch(listEvaluationReports({ evaluationId: evaluation.id }))
    })
  },
})

// Success notification when creating an evaluation report
listenerMiddleware.startListening({
  actionCreator: createEvaluationReport.fulfilled,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Evaluation report created successfully",
        type: "success",
      }),
    )
    await listenerApi.dispatch(listEvaluationReports({ evaluationId: action.payload.evaluationId }))
  },
})

// Error notification when creating an evaluation report fails
listenerMiddleware.startListening({
  actionCreator: createEvaluationReport.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Evaluation report creation failed",
        type: "error",
      }),
    )
  },
})

// Error notification when listing evaluation reports fails
listenerMiddleware.startListening({
  actionCreator: listEvaluationReports.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Failed to load evaluation reports",
        type: "error",
      }),
    )
  },
})

export const evaluationReportsMiddleware = listenerMiddleware
