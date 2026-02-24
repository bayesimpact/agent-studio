import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import { selectCurrentAgentId } from "../agents/agents.selectors"
import type { AgentExtractionRunSummary } from "./agent-extraction-runs.models"

export const selectAgentExtractionRunsStatus = (state: RootState) =>
  state.agentExtractionRuns.data.status

export const selectAgentExtractionRunsError = (state: RootState) =>
  state.agentExtractionRuns.data.error

export const selectAgentExtractionRunsData = (state: RootState) => state.agentExtractionRuns.data

const missingAgentId = { status: ADS.Error, value: null, error: "No agent selected" }

function buildRunsKey(agentId: string, type: "playground" | "live") {
  return `${agentId}:${type}`
}

export const selectAgentExtractionRunsFromAgentId = ({
  agentId,
  type,
}: {
  agentId?: string | null
  type: "playground" | "live"
}) =>
  createSelector(
    [selectAgentExtractionRunsData],
    (runsData): AsyncData<AgentExtractionRunSummary[]> => {
      if (!agentId) return missingAgentId

      if (!ADS.isFulfilled(runsData)) return { ...runsData }

      const runsKey = buildRunsKey(agentId, type)
      if (!runsData.value?.[runsKey]) return { status: ADS.Fulfilled, value: [], error: null }

      return { status: ADS.Fulfilled, value: runsData.value[runsKey], error: null }
    },
  )

export const selectCurrentAgentExtractionRunsData = createSelector(
  [selectCurrentAgentId, selectAgentExtractionRunsData],
  (agentId, runsData): AsyncData<AgentExtractionRunSummary[]> => {
    if (!agentId) return missingAgentId

    if (!ADS.isFulfilled(runsData)) return { ...runsData }

    const runsKey = buildRunsKey(agentId, "live")
    if (!runsData.value?.[runsKey]) return { status: ADS.Fulfilled, value: [], error: null }

    return { status: ADS.Fulfilled, value: runsData.value[runsKey], error: null }
  },
)
