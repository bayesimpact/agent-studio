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
  // ---------------------------------------------------------------------------
  // Mount listener — replaces fetch-on-mount useEffects.
  //
  // Each reviewer route fires `reviewCampaignsReviewerActions.mount()` from a
  // `useEffect` (and `unmount()` on cleanup). This listener reads URL-driven
  // state (via the `current*Id` slices populated by `useSetCurrentIds`) and
  // dispatches the loaders relevant to whichever route just mounted. Mirrors
  // the pattern in `eval/.../evaluation-extraction-runs.middleware.ts`.
  //
  // Why state-based dispatch and not URL-change predicates: on a hard reload,
  // `useSetCurrentIds` (in ProtectedRoute) dispatches the URL → state setters
  // before this scope-bound middleware is registered (the Shell only mounts
  // after Auth0 resolves). A predicate listener would miss that initial null
  // → id transition. Dispatching from the route's own mount sidesteps the
  // ordering issue entirely.
  // ---------------------------------------------------------------------------
  listenerMiddleware.startListening({
    actionCreator: reviewCampaignsReviewerActions.mount,
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState()
      const organizationId = selectCurrentOrganizationId(state)
      const projectId = selectCurrentProjectId(state)
      const reviewCampaignId = selectCurrentReviewCampaignId(state)
      const sessionId = selectCurrentReviewerSessionId(state)

      // Always available under /reviewer: the user's own campaign list.
      listenerApi.dispatch(listMyReviewerCampaigns())

      // On a campaign-scoped URL: load the shared tester context (campaign
      // metadata + agent snapshot — the reviewer spec reuses the tester
      // endpoint) and the reviewer's session list for that campaign.
      if (organizationId && projectId && reviewCampaignId) {
        const scope = { organizationId, projectId, reviewCampaignId }
        listenerApi.dispatch(getTesterContext(scope))
        listenerApi.dispatch(listReviewerSessions(scope))
      }

      // On a session-scoped URL: load the session detail for review.
      if (organizationId && projectId && reviewCampaignId && sessionId) {
        listenerApi.dispatch(
          getReviewerSession({ organizationId, projectId, reviewCampaignId, sessionId }),
        )
      }
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
