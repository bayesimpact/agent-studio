import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Project } from "../projects/projects.models"
import type { Document } from "./documents.models"
import { listDocuments } from "./documents.thunks"

type DataType = Record<Project["id"], Document[]> // keyed by projectId
interface State {
  currentDocumentId: string | null
  data: AsyncData<DataType>
}

const initialState: State = {
  currentDocumentId: null,
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    setCurrentDocumentId: (state, action: PayloadAction<{ documentId: string | null }>) => {
      state.currentDocumentId = action.payload.documentId
    },
    clearDocuments: (state, action: PayloadAction<{ projectId: string }>) => {
      // Clear documents for a specific project
      delete state.data.value?.[action.payload.projectId]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listDocuments.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listDocuments.fulfilled, (state, action) => {
        const projectId = action.payload[0]?.projectId
        if (!projectId) return
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: {
            ...state.data.value,
            [projectId]: action.payload,
          },
        }
      })
      .addCase(listDocuments.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list documents"
      })
  },
})

export type { State as DocumentsState }
export const documentsInitialState = initialState
export const documentsActions = { ...slice.actions }
export const documentsSliceReducer = slice.reducer
