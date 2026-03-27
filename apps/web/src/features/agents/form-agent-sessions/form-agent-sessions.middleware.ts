import type { ListenerEffectAPI } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store"
import { ADS } from "@/store/async-data-status"
import { hasInterfaceChanged } from "../../auth/auth.selectors"
import type { Agent } from "../agents.models"
import { selectAgentsData } from "../agents.selectors"
import { listAgents } from "../agents.thunks"
import { formAgentSessionsActions } from "./form-agent-sessions.slice"
import {
  createFormAgentSession,
  listFormAgentSessionsForAgents,
} from "./form-agent-sessions.thunks"

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
    listFormAgentSessionsForAgents({
      agentIds: Object.values(agents)
        .flat()
        .filter((agent) => agent.type === "form")
        .map((agent) => agent.id),
    }),
  )
}

// Refresh agent sessions when Agents are loaded
listenerMiddleware.startListening({
  actionCreator: listAgents.fulfilled,
  effect: async ({ payload: agents }, listenerApi) => {
    await loadAgentSessionsForAllAgents({ agents, listenerApi })
  },
})

// Refresh agent sessions when interface type changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    return hasInterfaceChanged(originalState, currentState)
  },
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(formAgentSessionsActions.reset())
    const state = listenerApi.getState()
    const agents = selectAgentsData(state)
    if (!ADS.isFulfilled(agents)) return
    await loadAgentSessionsForAllAgents({ agents: agents.value, listenerApi })
  },
})

listenerMiddleware.startListening({
  actionCreator: createFormAgentSession.fulfilled,
  effect: async (action, listenerApi) => {
    const { agentId, id } = action.payload
    await listenerApi.dispatch(listFormAgentSessionsForAgents({ agentIds: [agentId] }))
    const onSuccess = action.meta.arg.onSuccess
    onSuccess?.(id)
  },
})

export { listenerMiddleware as formAgentSessionsMiddleware }
