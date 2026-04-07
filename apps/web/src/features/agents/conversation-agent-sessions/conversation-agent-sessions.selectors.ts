import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/common/store"
import { ADS, type AsyncData } from "@/common/store/async-data-status"
import { selectCurrentAgentData } from "../agents.selectors"
import { selectCurrentAgentSessionId } from "../current-agent-session-id/current-agent-session-id.selectors"
import type { ConversationAgentSession } from "./conversation-agent-sessions.models"

const selectConversationAgentSessionsData = (state: RootState) =>
  state.conversationAgentSessions.data

const missingAgentId = { status: ADS.Error, value: null, error: "No Agent selected" }
const missingAgentSessions = {
  status: ADS.Error,
  value: null,
  error: "No agent sessions available",
}

export const selectCurrentConversationAgentSessionsData = createSelector(
  [selectCurrentAgentData, selectConversationAgentSessionsData],
  (agentData, sessionsData): AsyncData<ConversationAgentSession[]> => {
    if (!ADS.isFulfilled(agentData)) return { ...agentData }

    if (!ADS.isFulfilled(sessionsData)) return { ...sessionsData }

    const value = sessionsData.value[agentData.value.id]
    if (!value) return missingAgentSessions

    return { status: ADS.Fulfilled, value, error: null }
  },
)

export const selectCurrentConversationAgentSessionsDataFromAgentId = (agentId?: string | null) =>
  createSelector(
    [selectConversationAgentSessionsData],
    (conversationAgentSessionsData): AsyncData<ConversationAgentSession[]> => {
      if (!agentId) return missingAgentId

      if (!ADS.isFulfilled(conversationAgentSessionsData))
        return { ...conversationAgentSessionsData }

      const agentSessions = conversationAgentSessionsData.value[agentId]
      if (!agentSessions) return missingAgentSessions

      return { status: ADS.Fulfilled, value: agentSessions, error: null }
    },
  )

export const selectCurrentConversationAgentSessionData = createSelector(
  [selectCurrentConversationAgentSessionsData, selectCurrentAgentSessionId],
  (conversationAgentSessionsData, agentSessionId): AsyncData<ConversationAgentSession> => {
    if (!ADS.isFulfilled(conversationAgentSessionsData)) return { ...conversationAgentSessionsData }

    if (!agentSessionId) {
      // Return laoding on purpose
      return { status: ADS.Loading, value: null, error: null }
    }

    const agentSession = conversationAgentSessionsData.value.find((cs) => cs.id === agentSessionId)

    if (!agentSession)
      return {
        status: ADS.Error,
        value: null,
        error: "Conversation agent session not found in current Agent",
      }

    return { status: ADS.Fulfilled, value: agentSession, error: null }
  },
)
