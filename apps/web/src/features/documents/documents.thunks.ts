import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { DocumentTagsUpdateFields } from "../document-tags/document-tags.models"
import { getCurrentIds } from "../helpers"
import type { Document } from "./documents.models"
import { documentsActions } from "./documents.slice"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listDocuments = createAsyncThunk<Document[], void, ThunkConfig>(
  "documents/list",
  async (_, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return await services.documents.getAll({ organizationId, projectId })
  },
)

export const uploadDocument = createAsyncThunk<
  Document,
  {
    file: File
    sourceType: "project" | "agentSessionMessage" | "extraction"
    onSuccess?: (params: { documentId: string }) => void
  },
  ThunkConfig
>("documents/uploadOne", async ({ file, sourceType }, { extra: { services }, getState }) => {
  const state = getState()
  const { organizationId, projectId } = getCurrentIds({
    state,
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.documents.uploadOne({ organizationId, projectId, file, sourceType })
})

export const uploadDocuments = createAsyncThunk<
  void,
  {
    files: File[]
    sourceType: "project" | "agentSessionMessage" | "extraction"
  },
  ThunkConfig
>(
  "documents/uploadMany",
  async ({ files, sourceType }, { extra: { services }, getState, dispatch }) => {
    const state = getState()
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    await services.documents.uploadMany({
      organizationId,
      projectId,
      files,
      sourceType,
      onFileSettled: (result) => {
        if (result.status === "success") {
          dispatch(documentsActions.setOneDocumentCompleted())
        } else {
          dispatch(
            documentsActions.setOneDocumentError({
              error: result.error.message || "Failed to upload document",
            }),
          )
        }
      },
    })
  },
)

export const updateDocument = createAsyncThunk<
  void,
  {
    documentId: string
    fields: Partial<Pick<Document, "title">> & DocumentTagsUpdateFields
    onSuccess?: () => void
  },
  ThunkConfig
>("documents/update", async ({ documentId, fields }, { extra: { services }, getState }) => {
  const state = getState()
  const { organizationId, projectId } = getCurrentIds({
    state,
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.documents.updateOne({
    organizationId,
    projectId,
    documentId,
    payload: fields,
  })
})

export const deleteDocument = createAsyncThunk<
  void,
  { documentId: string; onSuccess?: () => void },
  ThunkConfig
>("documents/delete", async ({ documentId }, { extra: { services }, getState }) => {
  const state = getState()
  const { organizationId, projectId } = getCurrentIds({
    state,
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.documents.deleteOne({ organizationId, projectId, documentId })
})

export const getDocumentTemporaryUrl = createAsyncThunk<
  { url: string },
  { documentId: string },
  ThunkConfig
>("documents/getTemporaryUrl", async ({ documentId }, { extra: { services }, getState }) => {
  const state = getState()
  const { organizationId, projectId } = getCurrentIds({
    state,
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.documents.getTemporaryUrl({ organizationId, projectId, documentId })
})
