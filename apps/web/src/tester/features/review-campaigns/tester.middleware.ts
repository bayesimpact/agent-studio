import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import {
  hasAgentSessionChanged,
  selectCurrentAgentSessionId,
} from "@/common/features/agents/agent-sessions/current-agent-session-id/current-agent-session-id.selectors"
import { agentSessionMessagesActions } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.slice"
import { listMessages } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.thunks"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import { selectCurrentOrganizationId } from "@/common/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import {
  hasReviewCampaignIdChanged,
  selectCurrentReviewCampaignId,
} from "@/common/features/review-campaigns/current-review-campaign-id/current-review-campaign-id.selectors"
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
  // Data-loading listeners (replace fetch-on-mount useEffects in pages).
  // The tester listener middleware is only registered while the tester scope is
  // active (see `injectTesterSlices` / `resetTesterSlices`), so these listeners
  // implicitly only fire while the user is somewhere under /tester.
  // ---------------------------------------------------------------------------

  // Bootstrap: load the tester's campaign list when the scope opens.
  listenerMiddleware.startListening({
    actionCreator: reviewCampaignsTesterActions.enteredScope,
    effect: async (_, listenerApi) => {
      await listenerApi.dispatch(listMyReviewCampaigns())
    },
  })

  // URL-driven: when the route lands on a specific campaign, fetch the shared
  // context, the user's sessions for that campaign, and the existing survey.
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
        listenerApi.dispatch(listMyTesterSessions(scope)),
        listenerApi.dispatch(getMyTesterSurvey(scope)),
      ])
    },
  })

  // URL-driven: when leaving a campaign (id goes from non-null to null), drop
  // the cached selected context so the next campaign starts clean.
  listenerMiddleware.startListening({
    predicate: (_, currentState, originalState) =>
      hasReviewCampaignIdChanged(originalState, currentState) &&
      selectCurrentReviewCampaignId(currentState) === null &&
      selectCurrentReviewCampaignId(originalState) !== null,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(reviewCampaignsTesterActions.clearSelectedContext())
    },
  })

  // URL-driven: when the route lands on a specific agent session under the
  // tester scope, reset the streaming-messages slice and load the past
  // transcript. The shared `agent-session-messages.middleware` gates on the
  // studio sessions slice (which the tester flow doesn't populate), so this
  // listener compensates within the tester scope.
  listenerMiddleware.startListening({
    predicate: (_, currentState, originalState) =>
      hasAgentSessionChanged(originalState, currentState) &&
      selectCurrentAgentSessionId(currentState) !== null,
    effect: async (_, listenerApi) => {
      const agentSessionId = selectCurrentAgentSessionId(listenerApi.getState())
      if (!agentSessionId) return
      listenerApi.dispatch(agentSessionMessagesActions.reset())
      await listenerApi.dispatch(listMessages(agentSessionId))
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
