import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/common/store/async-data-status"
import type { DatasetFile, DatasetFileColumn, EvaluationDataset } from "./datasets.models"
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
  currentFileId: string | null
  data: AsyncData<EvaluationDataset[]>
  files: AsyncData<DatasetFile[]>
  fileColumns: AsyncData<DatasetFileColumn[]>
  uploader: UploaderState
  isUpdatingDataset: boolean
}

const initialState: State = {
  currentDatasetId: null,
  currentFileId: null,
  data: defaultAsyncData,
  files: defaultAsyncData,
  fileColumns: defaultAsyncData,
  uploader: {
    status: "idle",
    total: 0,
    processed: 0,
    errors: null,
  },
  isUpdatingDataset: false,
}

const slice = createSlice({
  name: "datasets",
  initialState,
  reducers: {
    reset: () => initialState,
    initData: () => {},
    setCurrentDatasetId: (state, action: PayloadAction<{ datasetId: string | null }>) => {
      state.currentDatasetId = action.payload.datasetId
    },
    setCurrentFileId: (state, action: PayloadAction<{ fileId: string | null }>) => {
      state.currentFileId = action.payload.fileId
    },
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
      .addCase(datasetsThunks.listDatasets.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(datasetsThunks.listDatasets.fulfilled, (state, action) => {
        state.isUpdatingDataset = false
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
        }
      })
      .addCase(datasetsThunks.listDatasets.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list datasets"
      })

    builder
      .addCase(datasetsThunks.getFileColumns.pending, (state) => {
        if (!ADS.isFulfilled(state.fileColumns)) state.fileColumns.status = ADS.Loading
        state.fileColumns.error = null
      })
      .addCase(datasetsThunks.getFileColumns.fulfilled, (state, action) => {
        state.fileColumns = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
        }
      })
      .addCase(datasetsThunks.getFileColumns.rejected, (state, action) => {
        state.fileColumns.status = ADS.Error
        state.fileColumns.error = action.error.message || "Failed to get file columns"
      })

    builder
      .addCase(datasetsThunks.updateOne.pending, (state) => {
        state.isUpdatingDataset = true
      })
      .addCase(datasetsThunks.updateOne.rejected, (state) => {
        state.isUpdatingDataset = false
      })
  },
})

export type { State as DatasetsState }
export const datasetsInitialState = initialState
export const datasetsActions = { ...slice.actions, ...datasetsThunks }
export const datasetsSlice = slice
