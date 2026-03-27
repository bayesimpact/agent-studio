import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { listConversationAgentSessionsForAgents } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.thunks"
import type { AppDispatch, RootState } from "@/store"
import {
  hasAgentSessionChanged,
  selectCurrentAgentSessionId,
} from "../../current-agent-session-id/current-agent-session-id.selectors"
import { listFormAgentSessionsForAgents } from "../../form-agent-sessions/form-agent-sessions.thunks"
import { listMessages } from "./agent-session-messages.thunks"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

// Refresh messages when current agent sessions are loaded and one is selected
listenerMiddleware.startListening({
  matcher: isAnyOf(
    listConversationAgentSessionsForAgents.fulfilled,
    listFormAgentSessionsForAgents.fulfilled,
  ),
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
    return hasAgentSessionChanged(originalState, currentState)
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const agentSessionId = selectCurrentAgentSessionId(state)
    if (!agentSessionId) return
    await listenerApi.dispatch(listMessages(agentSessionId))
  },
})

export { listenerMiddleware as agentSessionMessagesMiddleware }
