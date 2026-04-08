import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/common/store/async-data-status"
import type { ProjectMembership } from "./project-memberships.models"
import {
  inviteProjectMembers,
  listProjectMemberships,
  removeProjectMembership,
} from "./project-memberships.thunks"

interface State {
  data: AsyncData<ProjectMembership[]>
}

const initialState: State = {
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "projectMemberships",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(listProjectMemberships.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listProjectMemberships.fulfilled, (state, action) => {
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
        }
      })
      .addCase(listProjectMemberships.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list project memberships"
      })

    builder.addCase(inviteProjectMembers.fulfilled, (state, action) => {
      if (ADS.isFulfilled(state.data)) {
        state.data.value = [...state.data.value, ...action.payload]
      }
    })

    builder.addCase(removeProjectMembership.fulfilled, (state, action) => {
      if (ADS.isFulfilled(state.data)) {
        const { membershipId } = action.meta.arg
        state.data.value = state.data.value.filter((membership) => membership.id !== membershipId)
      }
    })
  },
})

export type { State as ProjectMembershipsState }
export const projectMembershipsInitialState = initialState
export const projectMembershipsActions = { ...slice.actions }
export const projectMembershipsSlice = slice
