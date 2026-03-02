import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import { selectAgentData } from "../agents.selectors"
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
  [selectAgentData, selectConversationAgentSessionsData],
  (agentData, conversationAgentSessionsData): AsyncData<ConversationAgentSession[]> => {
    if (!ADS.isFulfilled(agentData)) return { ...agentData }

    if (!ADS.isFulfilled(conversationAgentSessionsData)) return { ...conversationAgentSessionsData }

    const agentSessions = conversationAgentSessionsData.value[agentData.value.id]
    if (!agentSessions) return missingAgentSessions

    return { status: ADS.Fulfilled, value: agentSessions, error: null }
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

export const selectCurrentConversationAgentSessionId = (state: RootState) =>
  state.conversationAgentSessions.currentAgentSessionId

export const selectCurrentConversationAgentSessionData = createSelector(
  [selectCurrentConversationAgentSessionsData, selectCurrentConversationAgentSessionId],
  (conversationAgentSessionsData, agentSessionId): AsyncData<ConversationAgentSession> => {
    if (!ADS.isFulfilled(conversationAgentSessionsData)) return { ...conversationAgentSessionsData }

    if (!agentSessionId)
      return { status: ADS.Error, value: null, error: "No chat session selected" }

    const agentSession = conversationAgentSessionsData.value.find((cs) => cs.id === agentSessionId)

    if (!agentSession)
      return {
        status: ADS.Error,
        value: null,
        error: "Chat session not found in current Agent",
      }

    return { status: ADS.Fulfilled, value: agentSession, error: null }
  },
)

export const selectCurrentMessagesData = (state: RootState) =>
  state.conversationAgentSessions.messages

export const selectStreaming = (state: RootState) => state.conversationAgentSessions.isStreaming
