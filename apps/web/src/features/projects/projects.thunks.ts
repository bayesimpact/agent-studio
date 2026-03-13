import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { getCurrentIds } from "../helpers"
import type { Project } from "./projects.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const createProject = createAsyncThunk<
  Project,
  {
    payload: Pick<Project, "name">
    onSuccess?: (projectId: string) => void
  },
  ThunkConfig
>("projects/create", async ({ payload }, { extra: { services }, getState }) => {
  const params = getCurrentIds({ state: getState(), wantedIds: ["organizationId"] })
  return await services.projects.createOne(params, payload)
})

export const listProjects = createAsyncThunk<Project[], void, ThunkConfig>(
  "projects/list",
  async (_, { extra: { services }, getState }) => {
    const params = getCurrentIds({ state: getState(), wantedIds: ["organizationId"] })
    return await services.projects.getAll(params)
  },
)

export const updateProject = createAsyncThunk<
  void,
  { payload: Pick<Project, "name"> },
  ThunkConfig
>("projects/update", async ({ payload }, { extra: { services }, getState }) => {
  const params = getCurrentIds({
    state: getState(),
    wantedIds: ["organizationId", "projectId"],
  })
  await services.projects.updateOne(params, payload)
})

export const deleteProject = createAsyncThunk<void, { onSuccess?: () => void }, ThunkConfig>(
  "projects/delete",
  async ({ onSuccess }, { extra: { services }, getState }) => {
    const params = getCurrentIds({
      state: getState(),
      wantedIds: ["organizationId", "projectId"],
    })
    await services.projects.deleteOne(params)
    if (onSuccess) onSuccess()
  },
)
