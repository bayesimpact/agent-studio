import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store"
import { ADS } from "@/store/async-data-status"
import { selectAgentsData, selectCurrentAgentId } from "../agents/agents.selectors"
import { listAgents } from "../agents/agents.thunks"
import { selectIsAdminInterface } from "../auth/auth.selectors"
import { getCurrentIds } from "../helpers"
import { executeAgentExtractionRun, listAgentExtractionRuns } from "./agent-extraction-runs.thunks"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh agent extraction runs when Agents are loaded
listenerMiddleware.startListening({
  actionCreator: listAgents.fulfilled,
  effect: async ({ payload: agents }, listenerApi) => {
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    agents.forEach((agent) => {
      listenerApi.dispatch(
        listAgentExtractionRuns({ agentId: agent.id, playground: isAdminInterface }),
      )
    })
  },
})

// Refresh agent extraction runs when interface type changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevInterface = selectIsAdminInterface(originalState)
    const nextInterface = selectIsAdminInterface(currentState)
    return prevInterface !== nextInterface
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    const agents = selectAgentsData(state)
    if (ADS.isFulfilled(agents)) {
      for (const agent of Object.values(agents.value).flat()) {
        await listenerApi.dispatch(
          listAgentExtractionRuns({ agentId: agent.id, playground: isAdminInterface }),
        )
      }
    }
  },
})

// Refresh agent extraction runs when current Agent changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevId = selectCurrentAgentId(originalState)
    const nextId = selectCurrentAgentId(currentState)
    return prevId !== nextId
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const { agentId } = getCurrentIds({ state, wantedIds: ["agentId"] })
    const isAdminInterface = selectIsAdminInterface(state)
    await listenerApi.dispatch(listAgentExtractionRuns({ agentId, playground: isAdminInterface }))
  },
})

// Refresh agent extraction runs when create a new run
listenerMiddleware.startListening({
  actionCreator: executeAgentExtractionRun.fulfilled,
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const { agentId } = getCurrentIds({ state, wantedIds: ["agentId"] })
    const isAdminInterface = selectIsAdminInterface(state)
    await listenerApi.dispatch(listAgentExtractionRuns({ agentId, playground: isAdminInterface }))
  },
})

export { listenerMiddleware as agentExtractionRunsMiddleware }
