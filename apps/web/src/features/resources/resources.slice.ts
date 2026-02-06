import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Project } from "../projects/projects.models"
import type { Resource } from "./resources.models"
import { listResources } from "./resources.thunks"

type DataType = Record<Project["id"], Resource[]> // keyed by projectId
interface State {
  currentResourceId: string | null
  data: AsyncData<DataType>
}

const initialState: State = {
  currentResourceId: null,
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "resources",
  initialState,
  reducers: {
    setCurrentResourceId: (state, action: PayloadAction<{ resourceId: string | null }>) => {
      state.currentResourceId = action.payload.resourceId
    },
    clearResources: (state, action: PayloadAction<{ projectId: string }>) => {
      // Clear resources for a specific project
      delete state.data.value?.[action.payload.projectId]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listResources.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listResources.fulfilled, (state, action) => {
        const projectId = action.meta.arg.projectId
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: {
            ...state.data.value,
            [projectId]: action.payload,
          },
        }
      })
      .addCase(listResources.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list resources"
      })
  },
})

export type { State as ResourcesState }
export const resourcesInitialState = initialState
export const resourcesActions = { ...slice.actions }
export const resourcesSliceReducer = slice.reducer
