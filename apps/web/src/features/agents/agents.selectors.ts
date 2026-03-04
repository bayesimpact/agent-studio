import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import type { Agent } from "./agents.models"

export const selectAgentsStatus = (state: RootState) => state.agents.data.status

export const selectAgentsError = (state: RootState) => state.agents.data.error

export const selectAgentsData = (state: RootState) => state.agents.data

export const selectCurrentAgentId = (state: RootState) => state.agents.currentAgentId

export const selectCurrentAgentData = createSelector(
  [selectAgentsData, selectCurrentAgentId],
  (agentsData, agentId): AsyncData<Agent> => {
    if (!agentId) return { status: ADS.Error, value: null, error: "No Agent selected" }
    if (!ADS.isFulfilled(agentsData)) return { ...agentsData }
    const agent = agentsData.value.find((cb) => cb.id === agentId)
    if (!agent)
      return { status: ADS.Error, value: null, error: "Agent not found in current project" }
    return { status: ADS.Fulfilled, value: agent, error: null }
  },
)
