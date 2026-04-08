import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/common/store"
import type { Project } from "../../../common/features/projects/projects.models"
import { getCurrentIds } from "../../../features/helpers"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listProjects = createAsyncThunk<Project[], void, ThunkConfig>(
  "projects/list",
  async (_, { extra: { services }, getState }) => {
    const params = getCurrentIds({ state: getState(), wantedIds: ["organizationId"] })
    return await services.projects.getAll(params)
  },
)
