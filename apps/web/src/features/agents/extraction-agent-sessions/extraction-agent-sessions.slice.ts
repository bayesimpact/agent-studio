import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Agent } from "../agents.models"
import { listAgentSessionsForAgents } from "../shared/base-agent-session/base-agent-sessions.thunks"
import type { ExtractionAgentSessionSummary } from "./extraction-agent-sessions.models"

type DataType = Record<Agent["id"], ExtractionAgentSessionSummary[]>
interface State {
  data: AsyncData<DataType>
}

const initialState: State = {
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "extractionAgentSessions",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(listAgentSessionsForAgents.pending, (state, action) => {
        if (action.meta.arg.agentType !== "extraction") return
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listAgentSessionsForAgents.fulfilled, (state, action) => {
        if (action.meta.arg.agentType !== "extraction") return
        const sessionsByAgentId = action.payload.reduce((acc, curr) => {
          return Object.assign(acc, curr)
        }, {}) as DataType
        state.data = {
          value: {
            ...state.data.value,
            ...sessionsByAgentId,
          },
          status: ADS.Fulfilled,
          error: null,
        }
      })
      .addCase(listAgentSessionsForAgents.rejected, (state, action) => {
        if (action.meta.arg.agentType !== "extraction") return
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to load sessions"
      })
  },
})

export type { State as ExtractionAgentSessionsState }
export const extractionAgentSessionsInitialState = initialState
export const extractionAgentSessionsActions = { ...slice.actions }
export const extractionAgentSessionsSliceReducer = slice.reducer
