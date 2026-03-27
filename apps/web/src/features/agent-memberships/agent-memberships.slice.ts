import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { AgentMembership } from "./agent-memberships.models"
import {
  inviteAgentMembers,
  listAgentMemberships,
  removeAgentMembership,
} from "./agent-memberships.thunks"

interface State {
  data: AsyncData<AgentMembership[]>
}

const initialState: State = {
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "agentMemberships",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(listAgentMemberships.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listAgentMemberships.fulfilled, (state, action) => {
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
        }
      })
      .addCase(listAgentMemberships.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list agent memberships"
      })

    builder.addCase(inviteAgentMembers.fulfilled, (state, action) => {
      if (ADS.isFulfilled(state.data)) {
        state.data.value = [...state.data.value, ...action.payload]
      }
    })

    builder.addCase(removeAgentMembership.fulfilled, (state, action) => {
      if (ADS.isFulfilled(state.data)) {
        const { membershipId } = action.meta.arg
        state.data.value = state.data.value.filter((membership) => membership.id !== membershipId)
      }
    })
  },
})

export type { State as AgentMembershipsState }
export const agentMembershipsInitialState = initialState
export const agentMembershipsActions = { ...slice.actions }
export const agentMembershipsSliceReducer = slice.reducer
