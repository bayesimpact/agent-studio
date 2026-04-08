import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import { hasOrganizationChanged } from "@/common/features/organizations/organizations.selectors"
import type { AppDispatch, RootState } from "@/common/store/types"
import { hasProjectChanged } from "@/features/projects/projects.selectors"
import {
  createEvaluation,
  deleteEvaluation,
  listEvaluations,
  updateEvaluation,
} from "./evaluations.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

function registerListeners() {
  // Refresh evaluations when current project changes or when user changes organization
  listenerMiddleware.startListening({
    predicate(_, currentState, originalState) {
      return (
        hasProjectChanged(originalState, currentState) ||
        hasOrganizationChanged(originalState, currentState)
      )
    },
    effect: async (_, listenerApi) => {
      await listenerApi.dispatch(listEvaluations())
    },
  })

  // Refresh evaluations when one is created, updated or deleted
  listenerMiddleware.startListening({
    matcher: isAnyOf(
      deleteEvaluation.fulfilled,
      createEvaluation.fulfilled,
      updateEvaluation.fulfilled,
    ),
    effect: async (_, listenerApi) => {
      await listenerApi.dispatch(listEvaluations())
    },
  })

  listenerMiddleware.startListening({
    actionCreator: createEvaluation.fulfilled,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Evaluation created successfully",
          type: "success",
        }),
      )
    },
  })
  listenerMiddleware.startListening({
    actionCreator: createEvaluation.rejected,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Evaluation creation failed",
          type: "error",
        }),
      )
    },
  })

  listenerMiddleware.startListening({
    actionCreator: updateEvaluation.fulfilled,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Evaluation updated successfully",
          type: "success",
        }),
      )
    },
  })
  listenerMiddleware.startListening({
    actionCreator: updateEvaluation.rejected,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Evaluation update failed",
          type: "error",
        }),
      )
    },
  })

  listenerMiddleware.startListening({
    actionCreator: deleteEvaluation.fulfilled,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Evaluation deleted successfully",
          type: "success",
        }),
      )
    },
  })
  listenerMiddleware.startListening({
    actionCreator: deleteEvaluation.rejected,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Evaluation deletion failed",
          type: "error",
        }),
      )
    },
  })
}

export const evaluationsMiddleware = { listenerMiddleware, registerListeners }
