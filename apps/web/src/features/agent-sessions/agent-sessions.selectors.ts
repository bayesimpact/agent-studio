import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import type { AgentSession } from "./agent-sessions.models"

export const selectAgentSessionStatus = (state: RootState) => state.agentSessions.data.status

export const selectAgentSessionError = (state: RootState) => state.agentSessions.data.error

const selectAgentSessionsData = (state: RootState) => state.agentSessions.data

const missingagentId = { status: ADS.Error, value: null, error: "No Agent selected" }
const missingagentSessions = {
  status: ADS.Error,
  value: null,
  error: "No agent sessions available",
}

export const selectAgentSessionsFromAgentId = (agentId?: string | null) =>
  createSelector([selectAgentSessionsData], (agentSessionsData): AsyncData<AgentSession[]> => {
    if (!agentId) return missingagentId

    if (!ADS.isFulfilled(agentSessionsData)) return { ...agentSessionsData }

    if (!agentSessionsData.value?.[agentId]) return missingagentSessions

    return { status: ADS.Fulfilled, value: agentSessionsData.value[agentId], error: null }
  })

export const selectCurrentAgentSessionId = (state: RootState) =>
  state.agentSessions.currentAgentSessionId

export const selectCurrentAgentSessionDataFromAgentId = (agentId?: string | null) =>
  createSelector(
    [selectAgentSessionsFromAgentId(agentId), selectCurrentAgentSessionId],
    (agentSessionsData, agentSessionId): AsyncData<AgentSession> => {
      if (!ADS.isFulfilled(agentSessionsData)) return { ...agentSessionsData }

      if (!agentSessionId)
        return { status: ADS.Error, value: null, error: "No chat session selected" }

      const agentSession = agentSessionsData.value.find((cs) => cs.id === agentSessionId)

      if (!agentSession)
        return {
          status: ADS.Error,
          value: null,
          error: "Chat session not found in current Agent",
        }

      return { status: ADS.Fulfilled, value: agentSession, error: null }
    },
  )

export const selectCurrentMessagesData = (state: RootState) => state.agentSessions.messages
export const selectCurrentMessages = (state: RootState) => state.agentSessions.messages.value

export const selectAgentSessionMessagesStatus = (state: RootState) =>
  state.agentSessions.messages.status

export const selectAgentSessionMessagesError = (state: RootState) =>
  state.agentSessions.messages.error

export const selectStreaming = (state: RootState) => state.agentSessions.isStreaming

export const selectFirstSessionFromAgentId = (agentId?: string) => (state: RootState) => {
  if (!agentId) return null
  const sessions = state.agentSessions.data
  if (!ADS.isFulfilled(sessions)) return null
  return sessions.value[agentId]?.[0] || null
}
