import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/common/store/async-data-status"
import type { DatasetFile, DatasetFileColumn } from "./datasets.models"
import { datasetsThunks } from "./datasets.thunks"

export type UploaderError = { title: string; description: string }
type UploaderState = {
  status: "idle" | "uploading" | "completed"
  total: number
  processed: number
  errors: UploaderError[] | null
}

interface State {
  currentDatasetId: string | null
  data: AsyncData<Document[]>
  files: AsyncData<DatasetFile[]>
  columns: AsyncData<DatasetFileColumn[]>
  uploader: UploaderState
}

const initialState: State = {
  currentDatasetId: null,
  data: defaultAsyncData,
  files: defaultAsyncData,
  columns: defaultAsyncData,
  uploader: {
    status: "idle",
    total: 0,
    processed: 0,
    errors: null,
  },
}

const slice = createSlice({
  name: "datasets",
  initialState,
  reducers: {
    reset: () => initialState,
    initData: () => {},
    resetUploaderCounters: (state) => {
      state.uploader.total = 0
      state.uploader.processed = 0
      state.uploader.status = "idle"
    },
    setFileProcessed: (state) => {
      if (state.uploader.processed + 1 === state.uploader.total) {
        state.uploader.status = "completed"
      } else if (state.uploader.status === "uploading") {
        state.uploader.processed += 1
      }
    },
    setFileError: (state, action: PayloadAction<{ error: UploaderError }>) => {
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
    setCurrentDatasetId: (state, action: PayloadAction<{ datasetId: string | null }>) => {
      state.currentDatasetId = action.payload.datasetId
    },
  },
  extraReducers: (builder) => {
    builder.addCase(datasetsThunks.uploadFile.pending, (state) => {
      state.uploader.status = "uploading"
      state.uploader.total = 1
      state.uploader.processed = 0
    })

    builder
      .addCase(datasetsThunks.listFiles.pending, (state) => {
        if (!ADS.isFulfilled(state.files)) state.files.status = ADS.Loading
        state.files.error = null
      })
      .addCase(datasetsThunks.listFiles.fulfilled, (state, action) => {
        state.files = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
        }
      })
      .addCase(datasetsThunks.listFiles.rejected, (state, action) => {
        state.files.status = ADS.Error
        state.files.error = action.error.message || "Failed to list files"
      })

    builder
      .addCase(datasetsThunks.getColumns.pending, (state) => {
        if (!ADS.isFulfilled(state.columns)) state.columns.status = ADS.Loading
        state.columns.error = null
      })
      .addCase(datasetsThunks.getColumns.fulfilled, (state, action) => {
        state.columns = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
        }
      })
      .addCase(datasetsThunks.getColumns.rejected, (state, action) => {
        state.columns.status = ADS.Error
        state.columns.error = action.error.message || "Failed to get columns"
      })
  },
})

export type { State as DatasetsState }
export const datasetsInitialState = initialState
export const datasetsActions = { ...slice.actions, ...datasetsThunks }
export const datasetsSlice = slice
