import { createSlice, isAnyOf } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Agent } from "../agents.models"
import type { FormAgentSession } from "./form-agent-sessions.models"
import {
  listFormAgentSessionsForAgents,
  refreshFormResultForCurrentAgentSession,
} from "./form-agent-sessions.thunks"

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
      .addCase(listFormAgentSessionsForAgents.fulfilled, (state, action) => {
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

    builder
      .addMatcher(
        isAnyOf(
          listFormAgentSessionsForAgents.pending,
          refreshFormResultForCurrentAgentSession.pending,
        ),
        (state) => {
          if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
          state.data.error = null
        },
      )
      .addMatcher(
        isAnyOf(
          listFormAgentSessionsForAgents.rejected,
          refreshFormResultForCurrentAgentSession.rejected,
        ),
        (state, action) => {
          state.data.status = ADS.Error
          state.data.error = action.error.message || "Failed to load sessions"
        },
      )
  },
})

export type { State as formAgentSessionsState }
export const formAgentSessionsInitialState = initialState
export const formAgentSessionsActions = { ...slice.actions }
export const formAgentSessionsSliceReducer = slice.reducer
