import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Agent } from "../agents.models"
import type { ExtractionAgentSessionSummary } from "./extraction-agent-sessions.models"
import { listExtractionAgentSessions } from "./extraction-agent-sessions.thunks"

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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listExtractionAgentSessions.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listExtractionAgentSessions.fulfilled, (state, action) => {
        const runsKey = `${action.meta.arg.agentId}:${action.meta.arg.playground ? "playground" : "live"}`
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: {
            ...state.data.value,
            [runsKey]: action.payload,
          },
        }
      })
      .addCase(listExtractionAgentSessions.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list extraction runs"
      })
  },
})

export type { State as ExtractionAgentSessionsState }
export const extractionAgentSessionsInitialState = initialState
export const extractionAgentSessionsActions = { ...slice.actions }
export const extractionAgentSessionsSliceReducer = slice.reducer
