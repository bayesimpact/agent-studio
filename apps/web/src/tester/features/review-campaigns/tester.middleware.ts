import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { selectCurrentAgentSessionId } from "@/common/features/agents/agent-sessions/current-agent-session-id/current-agent-session-id.selectors"
import { agentSessionMessagesActions } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.slice"
import { listMessages } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.thunks"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import { selectCurrentOrganizationId } from "@/common/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import { selectCurrentReviewCampaignId } from "@/common/features/review-campaigns/current-review-campaign-id/current-review-campaign-id.selectors"
import type { AppDispatch, RootState } from "@/common/store/types"
import { reviewCampaignsTesterActions } from "./tester.slice"
import {
  getMyTesterSurvey,
  getTesterContext,
  listMyReviewCampaigns,
  listMyTesterSessions,
  startTesterSession,
  submitTesterFeedback,
  submitTesterSurvey,
  updateTesterFeedback,
  updateTesterSurvey,
} from "./tester.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

function registerListeners() {
  // ---------------------------------------------------------------------------
  // Mount listener — replaces fetch-on-mount useEffects.
  //
  // Each tester route fires `reviewCampaignsTesterActions.mount()` from a
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
    actionCreator: reviewCampaignsTesterActions.mount,
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState()
      // FIXME:
      const organizationId = selectCurrentOrganizationId(state)
      const projectId = selectCurrentProjectId(state)
      const reviewCampaignId = selectCurrentReviewCampaignId(state)
      const agentSessionId = selectCurrentAgentSessionId(state)

      // Always available under /tester: the user's own campaign list.
      listenerApi.dispatch(listMyReviewCampaigns())

      // On a campaign-scoped URL: load the shared context, the user's
      // sessions for that campaign, and any existing survey.
      if (organizationId && projectId && reviewCampaignId) {
        const scope = { organizationId, projectId, reviewCampaignId }
        listenerApi.dispatch(getTesterContext(scope))
        listenerApi.dispatch(listMyTesterSessions(scope))
        listenerApi.dispatch(getMyTesterSurvey(scope))
      }

      // On a session-scoped URL: reset the streaming-messages slice and
      // load the past transcript. The shared agent-session-messages
      // middleware gates on the studio sessions slice (which the tester
      // flow doesn't populate), so this is the tester-side compensation.
      if (agentSessionId) {
        listenerApi.dispatch(agentSessionMessagesActions.reset())
        listenerApi.dispatch(listMessages(agentSessionId))
      }
    },
  })

  // ---------------------------------------------------------------------------
  // Notification listeners (existing behavior).
  // ---------------------------------------------------------------------------
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
  // FIXME:
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
