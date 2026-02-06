import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import {
  createAgentSession,
  listSessions,
  loadSessionMessages,
} from "@/features/agent-sessions/agent-sessions.thunks"
import type { AppDispatch, RootState } from "@/store"
import { ADS } from "@/store/async-data-status"
import { selectAgentsData, selectCurrentAgentId } from "../agents/agents.selectors"
import { listAgents } from "../agents/agents.thunks"
import { selectIsAdminInterface } from "../auth/auth.selectors"
import { selectCurrentAgentSessionId } from "./agent-sessions.selectors"
import { agentSessionsActions } from "./agent-sessions.slice"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh agent sessions when Agents are loaded
listenerMiddleware.startListening({
  actionCreator: listAgents.fulfilled,
  effect: async ({ payload: agents }, listenerApi) => {
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    agents.forEach((agent) => {
      listenerApi.dispatch(listSessions({ agentId: agent.id, playground: isAdminInterface }))
    })
  },
})

// Refresh agent sessions when current Agent changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevId = selectCurrentAgentId(originalState)
    const nextId = selectCurrentAgentId(currentState)
    return prevId !== nextId
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const agentId = selectCurrentAgentId(state)
    const isAdminInterface = selectIsAdminInterface(state)
    if (!agentId) return
    await listenerApi.dispatch(listSessions({ agentId, playground: isAdminInterface }))
  },
})

// Refresh messages when current agent sessions are loaded and one is selected
listenerMiddleware.startListening({
  actionCreator: listSessions.fulfilled,
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const agentSessionId = selectCurrentAgentSessionId(state)
    if (!agentSessionId) return
    await listenerApi.dispatch(loadSessionMessages(agentSessionId))
  },
})

// Refresh messages when current agent session changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevId = selectCurrentAgentSessionId(originalState)
    const nextId = selectCurrentAgentSessionId(currentState)
    return prevId !== nextId
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const agentSessionId = selectCurrentAgentSessionId(state)
    if (!agentSessionId) return
    await listenerApi.dispatch(loadSessionMessages(agentSessionId))
  },
})

listenerMiddleware.startListening({
  actionCreator: createAgentSession.fulfilled,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    const { agentId, id } = action.payload
    await listenerApi.dispatch(listSessions({ agentId, playground: isAdminInterface }))

    const onSuccess = action.meta.arg.onSuccess
    onSuccess?.(id)
  },
})

// Refresh agent sessions when interface type changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevInterface = selectIsAdminInterface(originalState)
    const nextInterface = selectIsAdminInterface(currentState)
    return prevInterface !== nextInterface
  },
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(agentSessionsActions.reset())
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    const agents = selectAgentsData(state)
    if (ADS.isFulfilled(agents)) {
      for (const agent of Object.values(agents.value).flat()) {
        await listenerApi.dispatch(
          listSessions({ agentId: agent.id, playground: isAdminInterface }),
        )
      }
    }
  },
})

export { listenerMiddleware as agentSessionMiddleware }
