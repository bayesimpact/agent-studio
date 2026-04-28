import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import { selectCurrentOrganizationId } from "@/common/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import {
  hasReviewCampaignIdChanged,
  selectCurrentReviewCampaignId,
} from "@/common/features/review-campaigns/current-review-campaign-id/current-review-campaign-id.selectors"
import {
  hasReviewerSessionIdChanged,
  selectCurrentReviewerSessionId,
} from "@/common/features/review-campaigns/current-reviewer-session-id/current-reviewer-session-id.selectors"
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
  // ---------------------------------------------------------------------------
  // Data-loading listeners (replace fetch-on-mount useEffects in pages).
  // The reviewer listener middleware is only registered while the reviewer
  // scope is active (see `injectReviewerSlices` / `resetReviewerSlices`), so
  // these listeners implicitly only fire while the user is somewhere under
  // /reviewer.
  // ---------------------------------------------------------------------------

  // Bootstrap: load the reviewer's campaign list when the scope opens.
  listenerMiddleware.startListening({
    actionCreator: reviewCampaignsReviewerActions.enteredScope,
    effect: async (_, listenerApi) => {
      await listenerApi.dispatch(listMyReviewerCampaigns())
    },
  })

  // URL-driven: when the route lands on a specific campaign, load the shared
  // tester context (campaign metadata + agent snapshot) and the reviewer's
  // session list for that campaign.
  listenerMiddleware.startListening({
    predicate: (_, currentState, originalState) =>
      hasReviewCampaignIdChanged(originalState, currentState) &&
      selectCurrentReviewCampaignId(currentState) !== null,
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState()
      const organizationId = selectCurrentOrganizationId(state)
      const projectId = selectCurrentProjectId(state)
      const reviewCampaignId = selectCurrentReviewCampaignId(state)
      if (!organizationId || !projectId || !reviewCampaignId) return
      const scope = { organizationId, projectId, reviewCampaignId }
      await Promise.all([
        listenerApi.dispatch(getTesterContext(scope)),
        listenerApi.dispatch(listReviewerSessions(scope)),
      ])
    },
  })

  // URL-driven: when the route lands on a specific session, load its detail.
  listenerMiddleware.startListening({
    predicate: (_, currentState, originalState) =>
      hasReviewerSessionIdChanged(originalState, currentState) &&
      selectCurrentReviewerSessionId(currentState) !== null,
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState()
      const organizationId = selectCurrentOrganizationId(state)
      const projectId = selectCurrentProjectId(state)
      const reviewCampaignId = selectCurrentReviewCampaignId(state)
      const sessionId = selectCurrentReviewerSessionId(state)
      if (!organizationId || !projectId || !reviewCampaignId || !sessionId) return
      await listenerApi.dispatch(
        getReviewerSession({ organizationId, projectId, reviewCampaignId, sessionId }),
      )
    },
  })

  // ---------------------------------------------------------------------------
  // Notification listeners (existing behavior).
  // ---------------------------------------------------------------------------
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
