import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import { selectIsAdminInterface } from "../../auth/auth.selectors"
import type { ExtractionAgentSessionSummary } from "./extraction-agent-sessions.models"

export const selectExtractionAgentSessionsData = (state: RootState) =>
  state.extractionAgentSessions.data

const missingAgentId = { status: ADS.Error, value: null, error: "No agent selected" }

function buildRunsKey(agentId: string, type: "playground" | "live") {
  return `${agentId}:${type}`
}

export const selectExtractionAgentSessionsFromAgentId = (agentId?: string | null) =>
  createSelector(
    [selectExtractionAgentSessionsData, selectIsAdminInterface],
    (runsData, isAdminInterface): AsyncData<ExtractionAgentSessionSummary[]> => {
      if (!agentId) return missingAgentId

      if (!ADS.isFulfilled(runsData)) return { ...runsData }

      const runsKey = buildRunsKey(agentId, isAdminInterface ? "playground" : "live")
      const value = runsData.value?.[runsKey]
      if (!value) return { status: ADS.Fulfilled, value: [], error: null }

      return { status: ADS.Fulfilled, value, error: null }
    },
  )
