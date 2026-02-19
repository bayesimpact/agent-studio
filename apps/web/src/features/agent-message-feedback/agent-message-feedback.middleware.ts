import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { selectCurrentAgentId } from "../agents/agents.selectors"
import { listAgents } from "../agents/agents.thunks"
import { notificationsActions } from "../notifications/notifications.slice"
import { selectCurrentOrganizationId } from "../organizations/organizations.selectors"
import {
  createAgentMessageFeedback,
  listAgentMessageFeedbacks,
} from "./agent-message-feedback.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// TODO: add listener on createFeedback should reload all feedback

// Refresh feedbacks when agents are loaded
listenerMiddleware.startListening({
  actionCreator: listAgents.fulfilled,
  effect: async (action, listenerApi) => {
    const agents = action.payload
    const state = listenerApi.getState()
    const organizationId = selectCurrentOrganizationId(state)
    const projectId = action.meta.arg.projectId
    if (!organizationId || !projectId) return

    agents.forEach((agent) => {
      listenerApi.dispatch(
        listAgentMessageFeedbacks({ organizationId, projectId, agentId: agent.id }),
      )
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
    const agentId = selectCurrentAgentId(state)
    const organizationId = selectCurrentOrganizationId(state)
    // Get projectId from current agent
    const agents = state.agents.data.value
    if (!agentId || !organizationId || !agents) return

    // Find the project from the agent
    let projectId: string | undefined
    for (const [pid, agentList] of Object.entries(agents)) {
      if (agentList.some((a) => a.id === agentId)) {
        projectId = pid
        break
      }
    }
    if (!projectId) return

    await listenerApi.dispatch(listAgentMessageFeedbacks({ organizationId, projectId, agentId }))
  },
})

listenerMiddleware.startListening({
  actionCreator: createAgentMessageFeedback.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Feedback submitted successfully",
        type: "success",
      }),
    )
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
