import { createListenerMiddleware, type ListenerEffectAPI } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store"
import { ADS } from "@/store/async-data-status"
import { hasInterfaceChanged } from "../../auth/auth.selectors"
import { getCurrentIds } from "../../helpers"
import type { Agent } from "../agents.models"
import { selectAgentsData } from "../agents.selectors"
import { listAgents } from "../agents.thunks"
import {
  executeExtractionAgentSession,
  listExtractionAgentSessionsForAgents,
} from "./extraction-agent-sessions.thunks"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

async function loadAgentSessionsForAllAgents({
  agents,
  listenerApi,
}: {
  agents: Agent[]
  listenerApi: ListenerEffectAPI<RootState, AppDispatch, unknown>
}) {
  await listenerApi.dispatch(
    listExtractionAgentSessionsForAgents({
      agentIds: Object.values(agents)
        .flat()
        .filter((agent) => agent.type === "extraction")
        .map((agent) => agent.id),
    }),
  )
}

// Refresh extraction agent sessions when Agents are loaded
listenerMiddleware.startListening({
  actionCreator: listAgents.fulfilled,
  effect: async ({ payload: agents }, listenerApi) => {
    await loadAgentSessionsForAllAgents({ agents, listenerApi })
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
    if (!ADS.isFulfilled(agents)) return
    await loadAgentSessionsForAllAgents({ agents: agents.value, listenerApi })
  },
})

// Refresh extraction agent sessions when create a new run
listenerMiddleware.startListening({
  actionCreator: executeExtractionAgentSession.fulfilled,
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const { agentId } = getCurrentIds({ state, wantedIds: ["agentId"] })
    await listenerApi.dispatch(listExtractionAgentSessionsForAgents({ agentIds: [agentId] }))
  },
})

export { listenerMiddleware as extractionAgentSessionsMiddleware }
