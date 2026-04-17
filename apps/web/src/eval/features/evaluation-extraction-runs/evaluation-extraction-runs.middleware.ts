import { createListenerMiddleware } from "@reduxjs/toolkit"
import throttle from "lodash/throttle"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import type { AppDispatch, RootState } from "@/common/store/types"
import { evaluationExtractionRunsActions } from "./evaluation-extraction-runs.slice"
import {
  startRunStatusStream,
  stopRunStatusStream,
  syncRunStatusStreamWithRuns,
} from "./evaluation-extraction-runs-stream-status"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

const throttledRefreshRecords = throttle(
  (dispatch: AppDispatch, evaluationExtractionRunId: string) => {
    dispatch(
      evaluationExtractionRunsActions.getRecords({ evaluationExtractionRunId, page: 0, limit: 10 }),
    )
  },
  5_000,
  { leading: true, trailing: false },
)

function registerListeners() {
  listenerMiddleware.startListening({
    actionCreator: evaluationExtractionRunsActions.createAndExecute.fulfilled,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Evaluation run started",
          type: "info",
        }),
      )
      listenerApi.dispatch(evaluationExtractionRunsActions.getAll())
      // Start SSE stream to track progress
      listenerApi.dispatch(evaluationExtractionRunsActions.startRunStatusStream())
    },
  })

  listenerMiddleware.startListening({
    actionCreator: evaluationExtractionRunsActions.createAndExecute.rejected,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Evaluation run failed to start",
          type: "error",
        }),
      )
    },
  })

  // SSE stream lifecycle
  listenerMiddleware.startListening({
    actionCreator: evaluationExtractionRunsActions.startRunStatusStream,
    effect: async (_, listenerApi) => {
      await startRunStatusStream(listenerApi)
    },
  })

  listenerMiddleware.startListening({
    actionCreator: evaluationExtractionRunsActions.stopRunStatusStream,
    effect: async () => {
      stopRunStatusStream()
    },
  })

  listenerMiddleware.startListening({
    actionCreator: evaluationExtractionRunsActions.patchRunStatus,
    effect: async (action, listenerApi) => {
      const { status, evaluationExtractionRunId } = action.payload

      if (status === "running") {
        throttledRefreshRecords(listenerApi.dispatch, evaluationExtractionRunId)
      }

      // When a run completes or fails, refetch records and the full run list
      if (status === "completed" || status === "failed") {
        throttledRefreshRecords.cancel()
        listenerApi.dispatch(evaluationExtractionRunsActions.getAll())
        listenerApi.dispatch(
          evaluationExtractionRunsActions.getRecords({
            evaluationExtractionRunId,
            page: 0,
            limit: 10,
          }),
        )

        if (status === "completed") {
          listenerApi.dispatch(
            notificationsActions.show({
              title: "Evaluation run completed successfully",
              type: "success",
            }),
          )
        } else {
          listenerApi.dispatch(
            notificationsActions.show({
              title: "Evaluation run failed",
              type: "error",
            }),
          )
        }
      }

      syncRunStatusStreamWithRuns(listenerApi)
    },
  })
}

export const evaluationExtractionRunsMiddleware = { listenerMiddleware, registerListeners }
