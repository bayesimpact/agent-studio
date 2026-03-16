import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store"
import { ADS } from "@/store/async-data-status"
import { hasInterfaceChanged } from "../../auth/auth.selectors"
import { getCurrentIds } from "../../helpers"
import { selectAgentsData } from "../agents.selectors"
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
      if (agent.type !== "extraction") return
      listenerApi.dispatch(listExtractionAgentSessions({ agentId: agent.id }))
    })
  },
})

// Refresh extraction agent sessions when interface type changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    return hasInterfaceChanged(originalState, currentState)
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
