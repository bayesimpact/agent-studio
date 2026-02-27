import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { getCurrentIds } from "../helpers"
import type { Document } from "./documents.models"

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
