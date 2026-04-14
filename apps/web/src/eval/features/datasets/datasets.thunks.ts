import { createAsyncThunk } from "@reduxjs/toolkit"
import { getCurrentIds } from "@/common/features/helpers"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import type { ThunkConfig } from "@/common/store/types"
import type {
  DatasetFile,
  DatasetFileColumn,
  EvaluationDataset,
  EvaluationDatasetSchemaColumn,
} from "./datasets.models"
import { datasetsActions } from "./datasets.slice"

const listFiles = createAsyncThunk<DatasetFile[], void, ThunkConfig>(
  "datasets/listFiles",
  async (_, { extra: { services }, getState }) => {
    const state = getState()
    const params = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return await services.evaluationDatasets.getAllFiles(params)
  },
)

const listDatasets = createAsyncThunk<EvaluationDataset[], void, ThunkConfig>(
  "datasets/listDatasets",
  async (_, { extra: { services }, getState }) => {
    const state = getState()
    const params = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return await services.evaluationDatasets.getAll(params)
  },
)

const getFileColumns = createAsyncThunk<DatasetFileColumn[], { documentId: string }, ThunkConfig>(
  "datasets/getColumns",
  async ({ documentId }, { extra: { services }, getState }) => {
    const state = getState()
    const params = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return await services.evaluationDatasets.getFileColumns({ ...params, documentId })
  },
)

const createOne = createAsyncThunk<{ success: true }, { name: string }, ThunkConfig>(
  "datasets/createOne",
  async (payload, { extra: { services }, getState }) => {
    const state = getState()
    const params = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return await services.evaluationDatasets.createOne({ ...params, payload })
  },
)

const updateOne = createAsyncThunk<
  { success: true },
  { datasetId: string; documentId: string; name: string; columns: EvaluationDatasetSchemaColumn[] },
  ThunkConfig
>(
  "datasets/updateOne",
  async ({ datasetId, documentId, name, columns }, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    const params = { organizationId, projectId, datasetId, documentId }
    const payload = { name, columns }
    return await services.evaluationDatasets.updateOne({ ...params, payload })
  },
)

const uploadFile = createAsyncThunk<void, { file: File }, ThunkConfig>(
  "datasets/uploadFile",
  async ({ file }, { extra: { services }, getState, dispatch }) => {
    const state = getState()
    const params = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    await services.documents.uploadMany({
      ...params,
      files: [file],
      sourceType: "evaluationDataset",
      onFileProcessed: (result) => {
        dispatch(datasetsActions.setFileProcessed())

        if (result.status === "error") {
          const title = `Error uploading file "${result.file.name}"`
          const description = result.error.message
          dispatch(
            notificationsActions.show({
              title: `${title}: ${description}`,
              type: "error",
            }),
          )
          dispatch(datasetsActions.setFileError({ error: { title, description } }))
        }
      },
    })
  },
)

const deleteFile = createAsyncThunk<void, { fileId: string }, ThunkConfig>(
  "datasets/deleteFile",
  async ({ fileId }, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    await services.documents.deleteOne({
      organizationId,
      projectId,
      documentId: fileId,
    })
  },
)

export const datasetsThunks = {
  listDatasets,
  listFiles,
  createOne,
  getFileColumns,
  uploadFile,
  updateOne,
  deleteFile,
}
