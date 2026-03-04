import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import { listConversationAgentSessions } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.thunks"
import type { AppDispatch, RootState } from "@/store"
import { selectCurrentAgentSessionId } from "../../current-agent-session-id/current-agent-session-id.selectors"
import { listMessages } from "./agent-session-messages.thunks"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh messages when current agent sessions are loaded and one is selected
listenerMiddleware.startListening({
  actionCreator: listConversationAgentSessions.fulfilled,
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const agentSessionId = selectCurrentAgentSessionId(state)
    if (!agentSessionId) return
    await listenerApi.dispatch(listMessages(agentSessionId))
  },
})

// Refresh messages when current agent session changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevId = selectCurrentAgentSessionId(originalState)
    const nextId = selectCurrentAgentSessionId(currentState)
    return prevId !== nextId && !!nextId
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const agentSessionId = selectCurrentAgentSessionId(state)
    if (!agentSessionId) return
    await listenerApi.dispatch(listMessages(agentSessionId))
  },
})

export { listenerMiddleware as agentSessionMessagesMiddleware }
