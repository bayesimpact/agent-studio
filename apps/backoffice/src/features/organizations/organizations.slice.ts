import type { CreateOrganizationResponseDto } from "@caseai-connect/api-contracts"
import { createSlice } from "@reduxjs/toolkit"
import { fetchMe } from "@/features/me/me.thunks"
import { createOrganization } from "./organizations.thunks"

interface Organization {
  id: string
  name: string
  role: string
}

interface OrganizationsState {
  organizations: Organization[]
  createdOrganization: CreateOrganizationResponseDto | null
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
    builder
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.organizations = action.payload.data.organizations
      })
      .addCase(createOrganization.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(createOrganization.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.createdOrganization = action.payload.data
        state.error = null
      })
      .addCase(createOrganization.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to create organization"
      })
  },
})

export const { clearCreatedOrganization } = organizationsSlice.actions
