import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { selectCurrentAgentId } from "../agents/agents.selectors"
import { listAgents } from "../agents/agents.thunks"
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
      listenerApi.dispatch(listAgentMessageFeedbacks({ agentId: agent.id }))
    })
  },
})

// Refresh feedbacks when current agent changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevId = selectCurrentAgentId(originalState)
    const nextId = selectCurrentAgentId(currentState)
    return prevId !== nextId
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const { agentId } = getCurrentIds({ state, wantedIds: ["agentId"] })
    await listenerApi.dispatch(listAgentMessageFeedbacks({ agentId }))
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
