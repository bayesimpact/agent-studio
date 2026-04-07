import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { fetchMe } from "@/features/me/me.thunks"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Organization } from "./organizations.models"
import { createOrganization } from "./organizations.thunks"

interface State {
  currentOrganizationId: string | null
  data: AsyncData<Organization[]>
}

const initialState: State = {
  currentOrganizationId: null,
  data: defaultAsyncData,
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
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload.organizations,
        }
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list organizations"
      })

    builder.addCase(createOrganization.pending, (state) => {
      if (!ADS.isFulfilled(state.data) || state.data.value?.length === 0) {
        // Required when no org yet
        state.data.status = ADS.Loading
      }
    })
  },
})

export type { State as OrganizationsState }
export const organizationsInitialState = initialState
export const organizationsActions = { ...slice.actions }
export const organizationsSlice = slice
