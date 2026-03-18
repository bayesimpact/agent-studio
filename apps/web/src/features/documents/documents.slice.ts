import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Document } from "./documents.models"
import { listDocuments, uploadDocuments } from "./documents.thunks"

export type UploaderError = { title: string; description: string }
type UploaderState = {
  status: "idle" | "uploading" | "completed"
  total: number
  processed: number
  errors: UploaderError[] | null
}
interface State {
  currentDocumentId: string | null
  data: AsyncData<Document[]>
  uploader: UploaderState
}

const initialState: State = {
  currentDocumentId: null,
  data: defaultAsyncData,
  uploader: {
    status: "idle",
    total: 0,
    processed: 0,
    errors: null,
  },
}

const slice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    resetUploaderCounters: (state) => {
      state.uploader.total = 0
      state.uploader.processed = 0
      state.uploader.status = "idle"
    },
    setOneDocumentProcessed: (state) => {
      if (state.uploader.processed + 1 === state.uploader.total) {
        state.uploader.status = "completed"
      } else if (state.uploader.status === "uploading") {
        state.uploader.processed += 1
      }
    },
    setOneDocumentError: (state, action: PayloadAction<{ error: UploaderError }>) => {
      if (!state.uploader.errors) {
        state.uploader.errors = []
      }
      state.uploader.errors.push(action.payload.error)

      if (
        state.uploader.processed + (state.uploader.errors ? state.uploader.errors.length : 0) ===
        state.uploader.total
      ) {
        state.uploader.status = "completed"
      }
    },
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

    builder.addCase(uploadDocuments.pending, (state, action) => {
      state.uploader.status = "uploading"
      state.uploader.total = action.meta.arg.files.length
      state.uploader.processed = 0
    })
  },
})

export type { State as DocumentsState }
export const documentsInitialState = initialState
export const documentsActions = { ...slice.actions }
export const documentsSliceReducer = slice.reducer
