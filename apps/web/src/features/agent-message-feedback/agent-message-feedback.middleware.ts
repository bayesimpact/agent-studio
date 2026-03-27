import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { listAgents } from "../agents/agents.thunks"
import { selectIsAdminInterface } from "../auth/auth.selectors"
import { getCurrentIds } from "../helpers"
import { notificationsActions } from "../notifications/notifications.slice"
import {
  createAgentMessageFeedback,
  listAgentMessageFeedbacks,
} from "./agent-message-feedback.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

// Refresh feedbacks when agents are loaded
listenerMiddleware.startListening({
  actionCreator: listAgents.fulfilled,
  effect: async (action, listenerApi) => {
    const agents = action.payload
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    if (!isAdminInterface) return

    await Promise.all(
      agents.map(async (agent) => {
        if (agent.type === "extraction") return
        await listenerApi.dispatch(listAgentMessageFeedbacks({ agentId: agent.id }))
      }),
    )
  },
})

// Refresh feedbacks when a new feedback is created
listenerMiddleware.startListening({
  actionCreator: createAgentMessageFeedback.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Feedback submitted successfully",
        type: "success",
      }),
    )

    const state = listenerApi.getState()
    const { agentId } = getCurrentIds({ state, wantedIds: ["agentId"] })
    await listenerApi.dispatch(listAgentMessageFeedbacks({ agentId }))
  },
})
listenerMiddleware.startListening({
  actionCreator: createAgentMessageFeedback.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Failed to submit feedback",
        type: "error",
      }),
    )
  },
})

export const agentMessageFeedbackMiddleware = listenerMiddleware
