import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { CreateProjectPayload, Project, UpdateProjectPayload } from "./projects.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const createProject = createAsyncThunk<Project, CreateProjectPayload, ThunkConfig>(
  "projects/create",
  async (payload, { extra: { services } }) => await services.projects.createOne(payload),
)

export const listProjects = createAsyncThunk<Project[], string, ThunkConfig>(
  "projects/list",
  async (organizationId, { extra: { services } }) => await services.projects.getAll(organizationId),
)

export const updateProject = createAsyncThunk<
  void,
  { projectId: string; payload: UpdateProjectPayload },
  ThunkConfig
>(
  "projects/update",
  async ({ projectId, payload }, { extra: { services } }) =>
    await services.projects.updateOne(projectId, payload),
)

export const deleteProject = createAsyncThunk<void, string, ThunkConfig>(
  "projects/delete",
  async (projectId, { extra: { services } }) => await services.projects.deleteOne(projectId),
)
