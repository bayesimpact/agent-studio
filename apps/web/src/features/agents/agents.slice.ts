import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import { initOrganization } from "../global.thunks"
import type { Project } from "../projects/projects.models"
import type { Agent } from "./agents.models"
import { listAgents } from "./agents.thunks"

type DataType = Record<Project["id"], Agent[]> // keyed by projectId
interface State {
  currentAgentId: string | null
  data: AsyncData<DataType>
}

const initialState: State = {
  currentAgentId: null,
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "agents",
  initialState,
  reducers: {
    setCurrentAgentId: (state, action: PayloadAction<{ agentId: string | null }>) => {
      state.currentAgentId = action.payload.agentId
    },
    clearAgents: (state, action: PayloadAction<{ projectId: string }>) => {
      // Clear Agents for a specific project
      delete state.data.value?.[action.payload.projectId]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initOrganization.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(initOrganization.fulfilled, (state, action) => {
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload.projects.reduce((acc, project) => {
            acc[project.id] = action.payload.agents[project.id] || []
            return acc
          }, {} as DataType),
        }
      })
      .addCase(initOrganization.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list agents"
      })

    builder
      .addCase(listAgents.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listAgents.fulfilled, (state, action) => {
        const projectId = action.payload[0]?.projectId
        if (!projectId) return // should not happen, but just in case
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: {
            ...state.data.value,
            [projectId]: action.payload,
          },
        }
      })
      .addCase(listAgents.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list agents"
      })
  },
})

export type { State as agentsState }
export const agentsInitialState = initialState
export const agentsActions = { ...slice.actions }
export const agentsSliceReducer = slice.reducer
