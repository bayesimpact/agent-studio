import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import type { ExtractionAgentSessionSummary } from "./extraction-agent-sessions.models"

export const selectExtractionAgentSessionsData = (state: RootState) =>
  state.extractionAgentSessions.data
export const selectIsProcessingExecution = (state: RootState) =>
  state.extractionAgentSessions.isProcesssingExecution

const missingAgentId = { status: ADS.Error, value: null, error: "No agent selected" }

export const selectExtractionAgentSessionsFromAgentId = (agentId?: string | null) =>
  createSelector(
    [selectExtractionAgentSessionsData],
    (runsData): AsyncData<ExtractionAgentSessionSummary[]> => {
      if (!agentId) return missingAgentId

      if (!ADS.isFulfilled(runsData)) return { ...runsData }

      const value = runsData.value?.[agentId]
      if (!value) return { status: ADS.Fulfilled, value: [], error: null }

      return { status: ADS.Fulfilled, value, error: null }
    },
  )
