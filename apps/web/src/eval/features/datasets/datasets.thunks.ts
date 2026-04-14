import { createAsyncThunk } from "@reduxjs/toolkit"
import { getCurrentIds } from "@/common/features/helpers"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import type { ThunkConfig } from "@/common/store/types"
import type {
  DatasetFile,
  DatasetFileColumn,
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

const getColumns = createAsyncThunk<DatasetFileColumn[], { documentId: string }, ThunkConfig>(
  "datasets/getColumns",
  async (payload, { extra: { services }, getState }) => {
    const state = getState()
    const params = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return await services.evaluationDatasets.getColumns({ ...params, payload })
  },
)

const createOne = createAsyncThunk<
  DatasetFile,
  { documentId: string; name: string; columns: EvaluationDatasetSchemaColumn[] },
  ThunkConfig
>("datasets/createOne", async (payload, { extra: { services }, getState }) => {
  const state = getState()
  const params = getCurrentIds({
    state,
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.evaluationDatasets.createOne({ ...params, payload })
})

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

export const datasetsThunks = { listFiles, createOne, getColumns, uploadFile, deleteFile }
