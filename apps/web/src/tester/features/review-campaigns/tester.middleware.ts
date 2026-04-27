import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import type { AppDispatch, RootState } from "@/common/store/types"
import {
  startTesterSession,
  submitTesterFeedback,
  submitTesterSurvey,
  updateTesterFeedback,
  updateTesterSurvey,
} from "./tester.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

function registerListeners() {
  listenerMiddleware.startListening({
    actionCreator: startTesterSession.fulfilled,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(notificationsActions.show({ title: "Session started", type: "success" }))
    },
  })
  listenerMiddleware.startListening({
    matcher: isAnyOf(submitTesterFeedback.fulfilled, updateTesterFeedback.fulfilled),
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(notificationsActions.show({ title: "Feedback saved", type: "success" }))
    },
  })
  listenerMiddleware.startListening({
    matcher: isAnyOf(submitTesterSurvey.fulfilled, updateTesterSurvey.fulfilled),
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(notificationsActions.show({ title: "Survey saved", type: "success" }))
    },
  })
  listenerMiddleware.startListening({
    matcher: isAnyOf(
      startTesterSession.rejected,
      submitTesterFeedback.rejected,
      updateTesterFeedback.rejected,
      submitTesterSurvey.rejected,
      updateTesterSurvey.rejected,
    ),
    effect: async (action, listenerApi) => {
      const errorAction = action as { error?: { message?: string } }
      listenerApi.dispatch(
        notificationsActions.show({
          title: errorAction.error?.message || "Something went wrong",
          type: "error",
        }),
      )
    },
  })
}

export const reviewCampaignsTesterMiddleware = { listenerMiddleware, registerListeners }
