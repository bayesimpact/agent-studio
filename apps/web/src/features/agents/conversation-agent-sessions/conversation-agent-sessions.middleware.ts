import { createListenerMiddleware, type ListenerEffectAPI } from "@reduxjs/toolkit"
import {
  createConversationAgentSession,
  listConversationAgentSessionsForAgents,
} from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.thunks"
import type { AppDispatch, RootState } from "@/store"
import { ADS } from "@/store/async-data-status"
import { hasInterfaceChanged } from "../../auth/auth.selectors"
import type { Agent } from "../agents.models"
import { selectAgentsData } from "../agents.selectors"
import { listAgents } from "../agents.thunks"
import { conversationAgentSessionsActions } from "./conversation-agent-sessions.slice"

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
    listConversationAgentSessionsForAgents({
      agentIds: Object.values(agents)
        .flat()
        .filter((agent) => agent.type === "conversation")
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
    listenerApi.dispatch(conversationAgentSessionsActions.reset())
    const state = listenerApi.getState()
    const agents = selectAgentsData(state)
    if (!ADS.isFulfilled(agents)) return
    await loadAgentSessionsForAllAgents({ agents: agents.value, listenerApi })
  },
})

listenerMiddleware.startListening({
  actionCreator: createConversationAgentSession.fulfilled,
  effect: async (action, listenerApi) => {
    const { agentId, id } = action.payload
    await listenerApi.dispatch(listConversationAgentSessionsForAgents({ agentIds: [agentId] }))
    const onSuccess = action.meta.arg.onSuccess
    onSuccess?.(id)
  },
})

export { listenerMiddleware as conversationAgentSessionsMiddleware }
