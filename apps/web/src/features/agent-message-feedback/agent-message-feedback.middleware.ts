import type { TypedStartListening } from "@reduxjs/toolkit"
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

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh feedbacks when agents are loaded
listenerMiddleware.startListening({
  actionCreator: listAgents.fulfilled,
  effect: async (action, listenerApi) => {
    const agents = action.payload
    agents.forEach((agent) => {
      const state = listenerApi.getState()
      const isAdminInterface = selectIsAdminInterface(state)
      if (agent.type === "extraction" || !isAdminInterface) return
      listenerApi.dispatch(listAgentMessageFeedbacks({ agentId: agent.id }))
    })
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
