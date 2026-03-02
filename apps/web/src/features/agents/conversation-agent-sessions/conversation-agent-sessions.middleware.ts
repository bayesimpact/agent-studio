import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import {
  createConversationAgentSession,
  listConversationAgentSessions,
  loadSessionMessages,
} from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.thunks"
import type { AppDispatch, RootState } from "@/store"
import { ADS } from "@/store/async-data-status"
import { selectIsAdminInterface } from "../../auth/auth.selectors"
import { getCurrentIds } from "../../helpers"
import { selectAgentsData, selectCurrentAgentId } from "../agents.selectors"
import { listAgents } from "../agents.thunks"
import { selectCurrentConversationAgentSessionId } from "./conversation-agent-sessions.selectors"
import { conversationAgentSessionsActions } from "./conversation-agent-sessions.slice"

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
      listenerApi.dispatch(
        listConversationAgentSessions({ agentId: agent.id, playground: isAdminInterface }),
      )
    })
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
    listenerApi.dispatch(conversationAgentSessionsActions.reset())
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    const agents = selectAgentsData(state)
    if (ADS.isFulfilled(agents)) {
      for (const agent of Object.values(agents.value).flat()) {
        await listenerApi.dispatch(
          listConversationAgentSessions({
            agentId: agent.id,
            playground: isAdminInterface,
          }),
        )
      }
    }
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
    const { agentId } = getCurrentIds({ state, wantedIds: ["agentId"] })
    const isAdminInterface = selectIsAdminInterface(state)
    await listenerApi.dispatch(
      listConversationAgentSessions({ agentId, playground: isAdminInterface }),
    )
  },
})

// Refresh messages when current agent sessions are loaded and one is selected
listenerMiddleware.startListening({
  actionCreator: listConversationAgentSessions.fulfilled,
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const agentSessionId = selectCurrentConversationAgentSessionId(state)
    if (!agentSessionId) return
    await listenerApi.dispatch(loadSessionMessages(agentSessionId))
  },
})

// Refresh messages when current agent session changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevId = selectCurrentConversationAgentSessionId(originalState)
    const nextId = selectCurrentConversationAgentSessionId(currentState)
    return prevId !== nextId
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const agentSessionId = selectCurrentConversationAgentSessionId(state)
    if (!agentSessionId) return
    await listenerApi.dispatch(loadSessionMessages(agentSessionId))
  },
})

listenerMiddleware.startListening({
  actionCreator: createConversationAgentSession.fulfilled,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    const { agentId, id } = action.payload
    await listenerApi.dispatch(
      listConversationAgentSessions({ agentId, playground: isAdminInterface }),
    )
    const onSuccess = action.meta.arg.onSuccess
    onSuccess?.(id)
  },
})

export { listenerMiddleware as conversationAgentSessionsMiddleware }
