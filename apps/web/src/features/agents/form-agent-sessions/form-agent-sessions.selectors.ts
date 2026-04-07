import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import { selectCurrentAgentData } from "../agents.selectors"
import { selectCurrentAgentSessionId } from "../current-agent-session-id/current-agent-session-id.selectors"
import type { FormAgentSession } from "./form-agent-sessions.models"

const selectFormAgentSessionsData = (state: RootState) => state.formAgentSessions.data

const missingAgentId = { status: ADS.Error, value: null, error: "No Agent selected" }
const missingAgentSessions = {
  status: ADS.Error,
  value: null,
  error: "No agent sessions available",
}

export const selectCurrentFormAgentSessionsData = createSelector(
  [selectCurrentAgentData, selectFormAgentSessionsData],
  (agentData, sessionsData): AsyncData<FormAgentSession[]> => {
    if (!ADS.isFulfilled(agentData)) return { ...agentData }

    if (!ADS.isFulfilled(sessionsData)) return { ...sessionsData }

    const value = sessionsData.value[agentData.value.id]
    if (!value) return missingAgentSessions

    return { status: ADS.Fulfilled, value, error: null }
  },
)

export const selectCurrentFormAgentSessionsDataFromAgentId = (agentId?: string | null) =>
  createSelector(
    [selectFormAgentSessionsData],
    (formAgentSessionsData): AsyncData<FormAgentSession[]> => {
      if (!agentId) return missingAgentId

      if (!ADS.isFulfilled(formAgentSessionsData)) return { ...formAgentSessionsData }

      const agentSessions = formAgentSessionsData.value[agentId]
      if (!agentSessions) return missingAgentSessions

      return { status: ADS.Fulfilled, value: agentSessions, error: null }
    },
  )

export const selectCurrentFormAgentSessionData = createSelector(
  [selectCurrentFormAgentSessionsData, selectCurrentAgentSessionId],
  (formAgentSessionsData, agentSessionId): AsyncData<FormAgentSession> => {
    if (!ADS.isFulfilled(formAgentSessionsData)) return { ...formAgentSessionsData }

    if (!agentSessionId) {
      // Return laoding on purpose
      return { status: ADS.Loading, value: null, error: null }
    }

    const agentSession = formAgentSessionsData.value.find((cs) => cs.id === agentSessionId)

    if (!agentSession)
      return {
        status: ADS.Error,
        value: null,
        error: "Form agent session not found in current Agent",
      }

    return { status: ADS.Fulfilled, value: agentSession, error: null }
  },
)
