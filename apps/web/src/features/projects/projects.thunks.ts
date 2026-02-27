import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { getCurrentIds } from "../helpers"
import type { CreateProjectPayload, Project, UpdateProjectPayload } from "./projects.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const createProject = createAsyncThunk<
  Project,
  {
    payload: CreateProjectPayload
    onSuccess?: (projectId: string) => void
  },
  ThunkConfig
>("projects/create", async ({ payload }, { extra: { services }, getState }) => {
  const { organizationId } = getCurrentIds({ state: getState(), wantedIds: ["organizationId"] })
  return await services.projects.createOne(organizationId, payload)
})

export const listProjects = createAsyncThunk<Project[], void, ThunkConfig>(
  "projects/list",
  async (_, { extra: { services }, getState }) => {
    const { organizationId } = getCurrentIds({ state: getState(), wantedIds: ["organizationId"] })
    return await services.projects.getAll(organizationId)
  },
)

export const updateProject = createAsyncThunk<void, { payload: UpdateProjectPayload }, ThunkConfig>(
  "projects/update",
  async ({ payload }, { extra: { services }, getState }) => {
    const { organizationId, projectId } = getCurrentIds({
      state: getState(),
      wantedIds: ["organizationId", "projectId"],
    })
    await services.projects.updateOne(organizationId, projectId, payload)
  },
)

export const deleteProject = createAsyncThunk<void, { onSuccess?: () => void }, ThunkConfig>(
  "projects/delete",
  async ({ onSuccess }, { extra: { services }, getState }) => {
    const { organizationId, projectId } = getCurrentIds({
      state: getState(),
      wantedIds: ["organizationId", "projectId"],
    })
    await services.projects.deleteOne(organizationId, projectId)
    if (onSuccess) onSuccess()
  },
)
