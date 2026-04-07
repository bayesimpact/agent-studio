import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Agent } from "./agents.models"
import { listAgents } from "./agents.thunks"

interface State {
  currentAgentId: string | null
  data: AsyncData<Agent[]>
}

const initialState: State = {
  currentAgentId: null,
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "agents",
  initialState,
  reducers: {
    reset: () => initialState,
    setCurrentAgentId: (state, action: PayloadAction<{ agentId: string | null }>) => {
      state.currentAgentId = action.payload.agentId
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listAgents.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listAgents.fulfilled, (state, action) => {
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
        }
      })
      .addCase(listAgents.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list agents"
      })
  },
})

export type { State as AgentsState }
export const agentsInitialState = initialState
export const agentsActions = { ...slice.actions }
export const agentsSlice = slice
