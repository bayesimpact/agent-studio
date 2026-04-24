import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import type { AppDispatch, RootState } from "@/common/store/types"
import { submitReviewerReview, updateReviewerReview } from "./reviewer.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

listenerMiddleware.startListening({
  matcher: isAnyOf(submitReviewerReview.fulfilled, updateReviewerReview.fulfilled),
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(notificationsActions.show({ title: "Review saved", type: "success" }))
  },
})
listenerMiddleware.startListening({
  matcher: isAnyOf(submitReviewerReview.rejected, updateReviewerReview.rejected),
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

export { listenerMiddleware as reviewCampaignsReviewerMiddleware }
