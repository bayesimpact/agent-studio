import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Document } from "./documents.models"
import { listDocuments } from "./documents.thunks"

interface State {
  currentDocumentId: string | null
  data: AsyncData<Document[]>
}

const initialState: State = {
  currentDocumentId: null,
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    reset: () => initialState,
    setCurrentDocumentId: (state, action: PayloadAction<{ documentId: string | null }>) => {
      state.currentDocumentId = action.payload.documentId
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listDocuments.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listDocuments.fulfilled, (state, action) => {
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
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
