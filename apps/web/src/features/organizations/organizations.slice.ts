import { createSlice } from "@reduxjs/toolkit"
import { fetchMe } from "@/features/me/me.thunks"
import type { Organization } from "./organizations.models"
import { createOrganization } from "./organizations.thunks"

interface OrganizationsState {
  organizations: Organization[]
  createdOrganization: Organization | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: OrganizationsState = {
  organizations: [],
  createdOrganization: null,
  status: "idle",
  error: null,
}

export const organizationsSlice = createSlice({
  name: "organizations",
  initialState,
  reducers: {
    clearCreatedOrganization: (state) => {
      state.createdOrganization = null
    },
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMe.fulfilled, (state, action) => {
      state.organizations = action.payload.organizations
    })

    builder
      .addCase(createOrganization.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(createOrganization.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.createdOrganization = action.payload
        state.error = null
        // Note: Organizations list will be updated by fetchMe.fulfilled
        // (Option A: single source of truth)
      })
      .addCase(createOrganization.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to create organization"
      })
  },
})

export const { clearCreatedOrganization } = organizationsSlice.actions
