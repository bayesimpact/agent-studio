import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import { selectAgentData } from "../agents/agents.selectors"
import type { AgentSession } from "./agent-sessions.models"

const selectAgentSessionsData = (state: RootState) => state.agentSessions.data

const missingAgentId = { status: ADS.Error, value: null, error: "No Agent selected" }
const missingAgentSessions = {
  status: ADS.Error,
  value: null,
  error: "No agent sessions available",
}

export const selectCurrentAgentSessionsData = createSelector(
  [selectAgentData, selectAgentSessionsData],
  (agentData, agentSessionsData): AsyncData<AgentSession[]> => {
    if (!ADS.isFulfilled(agentData)) return { ...agentData }

    if (!ADS.isFulfilled(agentSessionsData)) return { ...agentSessionsData }

    const agentSessions = agentSessionsData.value[agentData.value.id]
    if (!agentSessions) return missingAgentSessions

    return { status: ADS.Fulfilled, value: agentSessions, error: null }
  },
)

export const selectCurrentAgentSessionsDataFromAgentId = (agentId?: string | null) =>
  createSelector([selectAgentSessionsData], (agentSessionsData): AsyncData<AgentSession[]> => {
    if (!agentId) return missingAgentId

    if (!ADS.isFulfilled(agentSessionsData)) return { ...agentSessionsData }

    const agentSessions = agentSessionsData.value[agentId]
    if (!agentSessions) return missingAgentSessions

    return { status: ADS.Fulfilled, value: agentSessions, error: null }
  })

export const selectCurrentAgentSessionId = (state: RootState) =>
  state.agentSessions.currentAgentSessionId

export const selectCurrentAgentSessionData = createSelector(
  [selectCurrentAgentSessionsData, selectCurrentAgentSessionId],
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

export const selectStreaming = (state: RootState) => state.agentSessions.isStreaming
