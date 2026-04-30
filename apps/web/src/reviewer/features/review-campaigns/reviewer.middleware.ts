import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import { selectCurrentOrganizationId } from "@/common/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import { selectCurrentReviewCampaignId } from "@/common/features/review-campaigns/current-review-campaign-id/current-review-campaign-id.selectors"
import { selectCurrentReviewerSessionId } from "@/common/features/review-campaigns/current-reviewer-session-id/current-reviewer-session-id.selectors"
import type { AppDispatch, RootState } from "@/common/store/types"
import { getTesterContext } from "@/tester/features/review-campaigns/tester.thunks"
import { reviewCampaignsReviewerActions } from "./reviewer.slice"
import {
  getReviewerSession,
  listMyReviewerCampaigns,
  listReviewerSessions,
  submitReviewerReview,
  updateReviewerReview,
} from "./reviewer.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

function registerListeners() {
  listenerMiddleware.startListening({
    actionCreator: reviewCampaignsReviewerActions.mount,
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState()
      const organizationId = selectCurrentOrganizationId(state)
      const projectId = selectCurrentProjectId(state)
      const reviewCampaignId = selectCurrentReviewCampaignId(state)

      listenerApi.dispatch(listMyReviewerCampaigns())

      if (organizationId && projectId && reviewCampaignId) {
        const scope = { organizationId, projectId, reviewCampaignId }
        listenerApi.dispatch(getTesterContext(scope))
        listenerApi.dispatch(listReviewerSessions(scope))
      }
    },
  })

  listenerMiddleware.startListening({
    actionCreator: reviewCampaignsReviewerActions.sessionMount,
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState()
      const organizationId = selectCurrentOrganizationId(state)
      const projectId = selectCurrentProjectId(state)
      const reviewCampaignId = selectCurrentReviewCampaignId(state)
      const sessionId = selectCurrentReviewerSessionId(state)
      if (!organizationId || !projectId || !reviewCampaignId || !sessionId) return
      listenerApi.dispatch(
        getReviewerSession({ organizationId, projectId, reviewCampaignId, sessionId }),
      )
    },
  })

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
}

export const reviewCampaignsReviewerMiddleware = { listenerMiddleware, registerListeners }
