import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store"
import { ADS } from "@/store/async-data-status"
import { selectIsAdminInterface } from "../../auth/auth.selectors"
import { getCurrentIds } from "../../helpers"
import { selectAgentsData, selectCurrentAgentId } from "../agents.selectors"
import { listAgents } from "../agents.thunks"
import {
  executeExtractionAgentSession,
  listExtractionAgentSessions,
} from "./extraction-agent-sessions.thunks"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh extraction agent sessions when Agents are loaded
listenerMiddleware.startListening({
  actionCreator: listAgents.fulfilled,
  effect: async ({ payload: agents }, listenerApi) => {
    agents.forEach((agent) => {
      listenerApi.dispatch(listExtractionAgentSessions({ agentId: agent.id }))
    })
  },
})

// Refresh extraction agent sessions when interface type changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevInterface = selectIsAdminInterface(originalState)
    const nextInterface = selectIsAdminInterface(currentState)
    return prevInterface !== nextInterface
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const agents = selectAgentsData(state)
    if (ADS.isFulfilled(agents)) {
      for (const agent of Object.values(agents.value).flat()) {
        await listenerApi.dispatch(listExtractionAgentSessions({ agentId: agent.id }))
      }
    }
  },
})

// Refresh extraction agent sessions when current Agent changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevId = selectCurrentAgentId(originalState)
    const nextId = selectCurrentAgentId(currentState)
    return prevId !== nextId
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const { agentId } = getCurrentIds({ state, wantedIds: ["agentId"] })
    await listenerApi.dispatch(listExtractionAgentSessions({ agentId }))
  },
})

// Refresh extraction agent sessions when create a new run
listenerMiddleware.startListening({
  actionCreator: executeExtractionAgentSession.fulfilled,
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const { agentId } = getCurrentIds({ state, wantedIds: ["agentId"] })
    await listenerApi.dispatch(listExtractionAgentSessions({ agentId }))
  },
})

export { listenerMiddleware as extractionAgentSessionsMiddleware }
