import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/common/store/async-data-status"
import type { Agent } from "../agents.models"
import {
  createAgentSession,
  listAgentSessionsForAgents,
} from "../shared/base-agent-session/base-agent-sessions.thunks"
import type { FormAgentSession } from "./form-agent-sessions.models"
import { refreshFormResultForCurrentAgentSession } from "./form-agent-sessions.thunks"

type DataType = Record<Agent["id"], FormAgentSession[]> // keyed by agentId
type State = {
  data: AsyncData<DataType>
}

const initialState: State = {
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "formAgentSessions",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAgentSession.pending, (state, action) => {
        if (action.meta.arg.agentType !== "form") return
        state.data.status = ADS.Loading
      })
      .addCase(createAgentSession.rejected, (state, action) => {
        if (action.meta.arg.agentType !== "form") return
        state.data.status = ADS.Fulfilled
      })

    builder
      .addCase(refreshFormResultForCurrentAgentSession.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(refreshFormResultForCurrentAgentSession.fulfilled, (state, action) => {
        const agentId = action.meta.arg.agentId
        state.data = {
          value: {
            ...state.data.value,
            [agentId]: action.payload,
          },
          status: ADS.Fulfilled,
          error: null,
        }
      })
      .addCase(refreshFormResultForCurrentAgentSession.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to load form sessions"
      })

    builder
      .addCase(listAgentSessionsForAgents.pending, (state, action) => {
        if (action.meta.arg.agentType !== "form") return
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listAgentSessionsForAgents.fulfilled, (state, action) => {
        if (action.meta.arg.agentType !== "form") return
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
        if (action.meta.arg.agentType !== "form") return
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to load form sessions"
      })
  },
})

export type { State as formAgentSessionsState }
export const formAgentSessionsInitialState = initialState
export const formAgentSessionsActions = { ...slice.actions }
export const formAgentSessionsSlice = slice
