import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/common/store"
import { ADS, type AsyncData } from "@/common/store/async-data-status"
import type { DatasetFile } from "./datasets.models"

// FILES
export const selectFilesData = (state: RootState) => state.evaluation.datasets.files
export const selectLastFileData = (state: RootState) => {
  const uploaderState = selectUploaderState(state)
  switch (uploaderState.status) {
    case "idle":
      return { status: ADS.Uninitialized, error: null, value: null }
    case "uploading":
      return { status: ADS.Loading, error: null, value: null }
    default:
      break
  }

  if (ADS.isFulfilled(state.evaluation.datasets.files)) {
    const files = state.evaluation.datasets.files.value
    const lastFile = files[files.length - 1]
    if (!lastFile) {
      return { status: ADS.Error, error: "No file found", value: null }
    }
    return { status: ADS.Fulfilled, error: null, value: lastFile }
  }
  return state.evaluation.datasets.files
}

export const selectCurrentFileId = (state: RootState) => state.evaluation.datasets.currentFileId
export const selectCurrentFileData = createSelector(
  [selectFilesData, selectCurrentFileId],
  (filesData, fileId): AsyncData<DatasetFile> => {
    if (ADS.isFulfilled(filesData)) {
      const file = filesData.value.find((f) => f.id === fileId)
      if (file) {
        return { status: ADS.Fulfilled, error: null, value: file }
      } else {
        return { status: ADS.Error, error: "File not found", value: null }
      }
    }
    return filesData
  },
)
export const selectFileColumnsData = (state: RootState) => state.evaluation.datasets.fileColumns
export const selectUploaderState = (state: RootState) => state.evaluation.datasets.uploader

// DATASETS
export const selectDatasetsData = (state: RootState) => state.evaluation.datasets.data
