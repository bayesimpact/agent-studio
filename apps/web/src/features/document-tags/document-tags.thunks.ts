import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { getCurrentIds } from "../helpers"
import type { DocumentTag } from "./document-tags.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listDocumentTags = createAsyncThunk<DocumentTag[], void, ThunkConfig>(
  "documentTags/list",
  async (_, { extra: { services }, getState }) => {
    const params = getCurrentIds({ state: getState(), wantedIds: ["organizationId", "projectId"] })
    return await services.documentTags.getAll(params)
  },
)

export const getDocumentTag = createAsyncThunk<
  DocumentTag,
  { documentTagId: string },
  ThunkConfig
>("documentTags/getOne", async ({ documentTagId }, { extra: { services }, getState }) => {
  const { organizationId, projectId } = getCurrentIds({
    state: getState(),
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.documentTags.getOne({ organizationId, projectId, documentTagId })
})

export const createDocumentTag = createAsyncThunk<
  DocumentTag,
  {
    fields: Pick<DocumentTag, "name"> & Partial<Pick<DocumentTag, "description" | "parentId">>
    onSuccess?: (documentTag: DocumentTag) => void
  },
  ThunkConfig
>("documentTags/create", async (payload, { extra: { services }, getState }) => {
  const { organizationId, projectId } = getCurrentIds({
    state: getState(),
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.documentTags.createOne(
    { organizationId, projectId },
    {
      name: payload.fields.name,
      description: payload.fields.description,
      parentId: payload.fields.parentId,
    },
  )
})

export const updateDocumentTag = createAsyncThunk<
  void,
  {
    documentTagId: string
    fields: Partial<Pick<DocumentTag, "name" | "description" | "parentId">>
  },
  ThunkConfig
>("documentTags/update", async ({ documentTagId, fields }, { extra: { services }, getState }) => {
  const { organizationId, projectId } = getCurrentIds({
    state: getState(),
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.documentTags.updateOne({ organizationId, projectId, documentTagId }, fields)
})

export const deleteDocumentTag = createAsyncThunk<
  void,
  {
    documentTagId: string
    onSuccess?: (documentTagId: string) => void
  },
  ThunkConfig
>("documentTags/delete", async ({ documentTagId }, { extra: { services }, getState }) => {
  const { organizationId, projectId } = getCurrentIds({
    state: getState(),
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.documentTags.deleteOne({ organizationId, projectId, documentTagId })
})
