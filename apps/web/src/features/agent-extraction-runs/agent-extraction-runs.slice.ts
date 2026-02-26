import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Agent } from "../agents/agents.models"
import type { AgentExtractionRunSummary } from "./agent-extraction-runs.models"
import { listAgentExtractionRuns } from "./agent-extraction-runs.thunks"

type DataType = Record<Agent["id"], AgentExtractionRunSummary[]>
interface State {
  data: AsyncData<DataType>
}

const initialState: State = {
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "agentExtractionRuns",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listAgentExtractionRuns.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listAgentExtractionRuns.fulfilled, (state, action) => {
        const runsKey = `${action.meta.arg.agentId}:${action.meta.arg.type}`
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: {
            ...state.data.value,
            [runsKey]: action.payload,
          },
        }
      })
      .addCase(listAgentExtractionRuns.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list extraction runs"
      })
  },
})

export type { State as AgentExtractionRunsState }
export const agentExtractionRunsInitialState = initialState
export const agentExtractionRunsActions = { ...slice.actions }
export const agentExtractionRunsSliceReducer = slice.reducer
