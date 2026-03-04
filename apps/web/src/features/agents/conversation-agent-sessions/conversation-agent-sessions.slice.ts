import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Agent } from "../agents.models"
import type { ConversationAgentSession } from "./conversation-agent-sessions.models"
import { listConversationAgentSessions } from "./conversation-agent-sessions.thunks"

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
      .addCase(listConversationAgentSessions.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listConversationAgentSessions.fulfilled, (state, action) => {
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
      .addCase(listConversationAgentSessions.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to load sessions"
      })
  },
})

export type { State as conversationAgentSessionsState }
export const conversationAgentSessionsInitialState = initialState
export const conversationAgentSessionsActions = { ...slice.actions }
export const conversationAgentSessionsSliceReducer = slice.reducer
