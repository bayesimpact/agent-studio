import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Document } from "./documents.models"
import { listDocuments, uploadDocuments } from "./documents.thunks"

type UploaderState = {
  status: "idle" | "uploading" | "completed" | "error"
  total: number
  completed: number
  errors: string[] | null
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
    completed: 0,
    errors: null,
  },
}

const slice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    resetUploaderState: (state) => {
      state.uploader = initialState.uploader
    },
    setOneDocumentCompleted: (state) => {
      if (state.uploader.status === "uploading") {
        state.uploader.completed += 1
      }

      if (state.uploader.completed === state.uploader.total) {
        state.uploader.status = "completed"
      }
    },
    setOneDocumentError: (state, action: PayloadAction<{ error: string }>) => {
      if (!state.uploader.errors) {
        state.uploader.errors = []
      }
      state.uploader.errors.push(action.payload.error)

      if (
        state.uploader.completed + (state.uploader.errors ? state.uploader.errors.length : 0) ===
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
      state.uploader = {
        status: "uploading",
        total: action.meta.arg.files.length,
        completed: 0,
        errors: null,
      }
    })
  },
})

export type { State as DocumentsState }
export const documentsInitialState = initialState
export const documentsActions = { ...slice.actions }
export const documentsSliceReducer = slice.reducer
