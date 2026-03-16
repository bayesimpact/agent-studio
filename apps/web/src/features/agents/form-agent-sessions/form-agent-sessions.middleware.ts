import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store"
import { ADS } from "@/store/async-data-status"
import { hasInterfaceChanged } from "../../auth/auth.selectors"
import { selectAgentsData } from "../agents.selectors"
import { listAgents } from "../agents.thunks"
import { formAgentSessionsActions } from "./form-agent-sessions.slice"
import { createFormAgentSession, listFormAgentSessions } from "./form-agent-sessions.thunks"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh agent sessions when Agents are loaded
listenerMiddleware.startListening({
  actionCreator: listAgents.fulfilled,
  effect: async ({ payload: agents }, listenerApi) => {
    agents.forEach((agent) => {
      if (agent.type !== "form") return
      listenerApi.dispatch(listFormAgentSessions({ agentId: agent.id }))
    })
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
    if (ADS.isFulfilled(agents)) {
      for (const agent of Object.values(agents.value).flat()) {
        await listenerApi.dispatch(listFormAgentSessions({ agentId: agent.id }))
      }
    }
  },
})

listenerMiddleware.startListening({
  actionCreator: createFormAgentSession.fulfilled,
  effect: async (action, listenerApi) => {
    const { agentId, id } = action.payload
    await listenerApi.dispatch(listFormAgentSessions({ agentId }))
    const onSuccess = action.meta.arg.onSuccess
    onSuccess?.(id)
  },
})

export { listenerMiddleware as formAgentSessionsMiddleware }
