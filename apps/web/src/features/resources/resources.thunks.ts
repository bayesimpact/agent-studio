import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { Resource } from "./resources.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listResources = createAsyncThunk<
  Resource[],
  { organizationId: string; projectId: string },
  ThunkConfig
>(
  "resources/list",
  async (params, { extra: { services } }) => await services.resources.getAll(params),
)

export const uploadResource = createAsyncThunk<
  Resource,
  {
    organizationId: string
    projectId: string
    file: File
    onSuccess?: (params: { resourceId: string }) => void
  },
  ThunkConfig
>(
  "resources/uploadOne",
  async ({ organizationId, projectId, file }, { extra: { services } }) =>
    await services.resources.uploadOne({ organizationId, projectId, file }),
)

export const deleteResource = createAsyncThunk<
  void,
  {
    organizationId: string
    projectId: string
    resourceId: string
    onSuccess?: () => void
  },
  ThunkConfig
>(
  "resources/delete",
  async ({ organizationId, projectId, resourceId }, { extra: { services } }) =>
    await services.resources.deleteOne({ organizationId, projectId, resourceId }),
)
