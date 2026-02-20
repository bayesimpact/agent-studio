import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { Document } from "./documents.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listDocuments = createAsyncThunk<
  Document[],
  { organizationId: string; projectId: string },
  ThunkConfig
>(
  "documents/list",
  async (params, { extra: { services } }) => await services.documents.getAll(params),
)

export const uploadDocument = createAsyncThunk<
  Document,
  {
    organizationId: string
    projectId: string
    file: File
    sourceType: "project" | "agentSessionMessage"
    onSuccess?: (params: { documentId: string }) => void
  },
  ThunkConfig
>(
  "documents/uploadOne",
  async ({ organizationId, projectId, file, sourceType }, { extra: { services } }) =>
    await services.documents.uploadOne({ organizationId, projectId, file, sourceType }),
)

export const deleteDocument = createAsyncThunk<
  void,
  {
    organizationId: string
    projectId: string
    documentId: string
    onSuccess?: () => void
  },
  ThunkConfig
>(
  "documents/delete",
  async ({ organizationId, projectId, documentId }, { extra: { services } }) =>
    await services.documents.deleteOne({ organizationId, projectId, documentId }),
)

export const getDocumentTemporaryUrl = createAsyncThunk<
  { url: string },
  {
    organizationId: string
    projectId: string
    documentId: string
  },
  ThunkConfig
>(
  "documents/getTemporaryUrl",
  async ({ organizationId, projectId, documentId }, { extra: { services } }) =>
    await services.documents.getTemporaryUrl({ organizationId, projectId, documentId }),
)
