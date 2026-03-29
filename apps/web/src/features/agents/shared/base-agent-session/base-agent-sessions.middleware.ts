import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { hasInterfaceChanged } from "@/features/auth/auth.selectors"
import type { AppDispatch, RootState } from "@/store"
import { ADS } from "@/store/async-data-status"
import { selectAgentsData } from "../../agents.selectors"
import { listAgents } from "../../agents.thunks"
import { conversationAgentSessionsActions } from "../../conversation-agent-sessions/conversation-agent-sessions.slice"
import { extractionAgentSessionsActions } from "../../extraction-agent-sessions/extraction-agent-sessions.slice"
import { formAgentSessionsActions } from "../../form-agent-sessions/form-agent-sessions.slice"
import {
  createAgentSession,
  deleteAgentSession,
  listAgentSessionsForAgents,
  loadAgentSessionsForAllAgents,
} from "./base-agent-sessions.thunks"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

// Refresh agent sessions when Agents are loaded
listenerMiddleware.startListening({
  actionCreator: listAgents.fulfilled,
  effect: async ({ payload: agents }, listenerApi) => {
    await loadAgentSessionsForAllAgents({ agentType: "conversation", agents, listenerApi })
    await loadAgentSessionsForAllAgents({ agentType: "form", agents, listenerApi })
    await loadAgentSessionsForAllAgents({ agentType: "extraction", agents, listenerApi })
  },
})

// Refresh agent sessions when interface type changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    return hasInterfaceChanged(originalState, currentState)
  },
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(formAgentSessionsActions.reset())
    listenerApi.dispatch(conversationAgentSessionsActions.reset())
    listenerApi.dispatch(extractionAgentSessionsActions.reset())

    const state = listenerApi.getState()
    const agents = selectAgentsData(state)
    if (!ADS.isFulfilled(agents)) return

    await loadAgentSessionsForAllAgents({ agentType: "form", agents: agents.value, listenerApi })
    await loadAgentSessionsForAllAgents({
      agentType: "conversation",
      agents: agents.value,
      listenerApi,
    })
    await loadAgentSessionsForAllAgents({
      agentType: "extraction",
      agents: agents.value,
      listenerApi,
    })
  },
})

// Refresh Agent sessions when one is created or deleted
listenerMiddleware.startListening({
  matcher: isAnyOf(createAgentSession.fulfilled, deleteAgentSession.fulfilled),
  effect: async (action, listenerApi) => {
    // @ts-expect-error
    const { agentId, agentType } = action.meta.arg
    await listenerApi.dispatch(listAgentSessionsForAgents({ agentType, agentIds: [agentId] }))
  },
})

listenerMiddleware.startListening({
  actionCreator: createAgentSession.fulfilled,
  effect: async (action) => {
    const { id } = action.payload
    const onSuccess = action.meta.arg.onSuccess
    onSuccess?.(id)
  },
})

listenerMiddleware.startListening({
  actionCreator: deleteAgentSession.fulfilled,
  effect: async (action) => {
    const onSuccess = action.meta.arg.onSuccess
    onSuccess?.()
  },
})

export { listenerMiddleware as baseAgentSessionsMiddleware }
