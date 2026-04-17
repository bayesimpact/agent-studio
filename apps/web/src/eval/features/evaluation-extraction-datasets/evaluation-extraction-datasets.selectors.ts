import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/common/store"
import { ADS, type AsyncData } from "@/common/store/async-data-status"
import type { EvaluationExtractionDatasetFile } from "./evaluation-extraction-datasets.models"

// FILES
export const selectFilesData = (state: RootState) => state.evaluation.extractionDatasets.files
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

  if (ADS.isFulfilled(state.evaluation.extractionDatasets.files)) {
    const files = state.evaluation.extractionDatasets.files.value
    const lastFile = files[files.length - 1]
    if (!lastFile) {
      return { status: ADS.Error, error: "No file found", value: null }
    }
    return { status: ADS.Fulfilled, error: null, value: lastFile }
  }
  return state.evaluation.extractionDatasets.files
}
export const selectCurrentFileId = (state: RootState) =>
  state.evaluation.extractionDatasets.currentFileId
export const selectCurrentFileData = createSelector(
  [selectFilesData, selectCurrentFileId],
  (filesData, fileId): AsyncData<EvaluationExtractionDatasetFile> => {
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
export const selectFileColumnsData = (state: RootState) =>
  state.evaluation.extractionDatasets.fileColumns
export const selectUploaderState = (state: RootState) =>
  state.evaluation.extractionDatasets.uploader

// RECORDS
export const selectRecordsData = (state: RootState) => state.evaluation.extractionDatasets.records

// DATASETS
export const selectDatasetsData = (state: RootState) => state.evaluation.extractionDatasets.data
export const selectCurrentDatasetId = (state: RootState) =>
  state.evaluation.extractionDatasets.currentDatasetId
export const selectCurrentDatasetData = createSelector(
  [selectDatasetsData, selectCurrentDatasetId],
  (datasetsData, datasetId) => {
    if (ADS.isFulfilled(datasetsData)) {
      const dataset = datasetsData.value.find((d) => d.id === datasetId)
      if (dataset) {
        return { status: ADS.Fulfilled, error: null, value: dataset }
      } else {
        return { status: ADS.Error, error: "Dataset not found", value: null }
      }
    }
    return datasetsData
  },
)
export const selectIsUpdatingDataset = (state: RootState) =>
  state.evaluation.extractionDatasets.isUpdatingDataset
