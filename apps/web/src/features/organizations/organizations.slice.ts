import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { fetchMe } from "@/features/me/me.thunks"
import type { Organization } from "./organizations.models"

interface State {
  currentOrganizationId: string | null
  organizations: Organization[]
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: State = {
  currentOrganizationId: null,
  organizations: [],
  status: "idle",
  error: null,
}

const slice = createSlice({
  name: "organizations",
  initialState,
  reducers: {
    setCurrentOrganizationId: (state, action: PayloadAction<{ organizationId: string | null }>) => {
      state.currentOrganizationId = action.payload.organizationId
    },
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        if (state.status !== "succeeded") state.status = "loading"
        state.error = null
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.organizations = action.payload.organizations
        state.status = "succeeded"
        state.error = null
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to list organizations"
      })
  },
})

export type { State as OrganizationsState }
export const organizationsInitialState = initialState
export const organizationsActions = { ...slice.actions }
export const organizationsSliceReducer = slice.reducer
