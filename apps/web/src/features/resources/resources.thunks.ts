import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { Resource } from "./resources.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const uploadResource = createAsyncThunk<
  Resource,
  {
    organizationId: string
    projectId: string
    file: File
    onSuccess?: (params: { projectId: string; resourceId: string }) => void
  },
  ThunkConfig
>(
  "resources/uploadOne",
  async ({ organizationId, projectId, file }, { extra: { services } }) =>
    await services.resources.uploadOne({ organizationId, projectId, file }),
)
