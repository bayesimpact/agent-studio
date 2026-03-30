import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Agent } from "../agents.models"
import {
  createAgentSession,
  listAgentSessionsForAgents,
} from "../shared/base-agent-session/base-agent-sessions.thunks"
import type { ConversationAgentSession } from "./conversation-agent-sessions.models"

type DataType = Record<Agent["id"], ConversationAgentSession[]> // keyed by agentId
type State = {
  data: AsyncData<DataType>
}

const initialState: State = {
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "conversationAgentSessions",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAgentSession.pending, (state, action) => {
        if (action.meta.arg.agentType !== "conversation") return
        state.data.status = ADS.Loading
      })
      .addCase(createAgentSession.rejected, (state, action) => {
        if (action.meta.arg.agentType !== "conversation") return
        state.data.status = ADS.Fulfilled
      })

    builder
      .addCase(listAgentSessionsForAgents.pending, (state, action) => {
        if (action.meta.arg.agentType !== "conversation") return
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listAgentSessionsForAgents.fulfilled, (state, action) => {
        if (action.meta.arg.agentType !== "conversation") return
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
        if (action.meta.arg.agentType !== "conversation") return
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to load conversation sessions"
      })
  },
})

export type { State as conversationAgentSessionsState }
export const conversationAgentSessionsInitialState = initialState
export const conversationAgentSessionsActions = { ...slice.actions }
export const conversationAgentSessionsSliceReducer = slice.reducer
