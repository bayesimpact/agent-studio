import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Agent } from "../agents.models"
import type { ExtractionAgentSessionSummary } from "./extraction-agent-sessions.models"
import { listExtractionAgentSessionsForAgents } from "./extraction-agent-sessions.thunks"

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
      .addCase(listExtractionAgentSessionsForAgents.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listExtractionAgentSessionsForAgents.fulfilled, (state, action) => {
        const sessionsByAgentId = action.payload.reduce((acc, curr) => {
          return Object.assign(acc, curr)
        }, {})
        state.data = {
          value: {
            ...state.data.value,
            ...sessionsByAgentId,
          },
          status: ADS.Fulfilled,
          error: null,
        }
      })
      .addCase(listExtractionAgentSessionsForAgents.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to load sessions"
      })
  },
})

export type { State as ExtractionAgentSessionsState }
export const extractionAgentSessionsInitialState = initialState
export const extractionAgentSessionsActions = { ...slice.actions }
export const extractionAgentSessionsSliceReducer = slice.reducer
