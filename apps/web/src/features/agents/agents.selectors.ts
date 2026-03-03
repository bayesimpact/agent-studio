import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import { selectCurrentProjectId } from "../projects/projects.selectors"
import type { Agent } from "./agents.models"

export const selectAgentsStatus = (state: RootState) => state.agents.data.status

export const selectAgentsError = (state: RootState) => state.agents.data.error

export const selectAgentsData = (state: RootState) => state.agents.data

const missingProjectId = { status: ADS.Error, value: null, error: "No project selected" }
const missingAgents = { status: ADS.Error, value: null, error: "No agents available" }

export const selectAgentsFromProjectId = (projectId?: string | null) =>
  createSelector([selectAgentsData], (agentsData): AsyncData<Agent[]> => {
    if (!projectId) return missingProjectId

    if (!ADS.isFulfilled(agentsData)) return { ...agentsData }

    if (!agentsData.value?.[projectId]) return missingAgents

    return { status: ADS.Fulfilled, value: agentsData.value[projectId], error: null }
  })

export const selectCurrentAgentId = (state: RootState) => state.agents.currentAgentId

export const selectCurrentAgentsData = createSelector(
  [selectCurrentProjectId, selectAgentsData],
  (projectId, agentsData): AsyncData<Agent[]> => {
    if (!projectId) return missingProjectId

    if (!ADS.isFulfilled(agentsData)) return { ...agentsData }

    if (!agentsData.value?.[projectId]) return missingAgents

    return { status: ADS.Fulfilled, value: agentsData.value[projectId], error: null }
  },
)

export const selectCurrentAgentData = createSelector(
  [selectCurrentAgentsData, selectCurrentAgentId],
  (agentsData, agentId): AsyncData<Agent> => {
    if (!agentId) return { status: ADS.Error, value: null, error: "No Agent selected" }
    if (!ADS.isFulfilled(agentsData)) return { ...agentsData }
    const agent = agentsData.value.find((cb) => cb.id === agentId)
    if (!agent)
      return { status: ADS.Error, value: null, error: "Agent not found in current project" }
    return { status: ADS.Fulfilled, value: agent, error: null }
  },
)
