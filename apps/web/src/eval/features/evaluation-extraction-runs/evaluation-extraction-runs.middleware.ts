import { createListenerMiddleware } from "@reduxjs/toolkit"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import type { AppDispatch, RootState } from "@/common/store/types"
import { evaluationExtractionRunsActions } from "./evaluation-extraction-runs.slice"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

function registerListeners() {
  listenerMiddleware.startListening({
    actionCreator: evaluationExtractionRunsActions.createAndExecute.fulfilled,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Evaluation run completed successfully",
          type: "success",
        }),
      )
      listenerApi.dispatch(evaluationExtractionRunsActions.getAll())
    },
  })

  listenerMiddleware.startListening({
    actionCreator: evaluationExtractionRunsActions.createAndExecute.rejected,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Evaluation run failed",
          type: "error",
        }),
      )
    },
  })
}

export const evaluationExtractionRunsMiddleware = { listenerMiddleware, registerListeners }
