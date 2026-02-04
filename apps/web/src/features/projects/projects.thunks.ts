import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { CreateProjectPayload, Project, UpdateProjectPayload } from "./projects.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const createProject = createAsyncThunk<
  Project,
  {
    organizationId: string
    payload: CreateProjectPayload
    onSuccess?: (projectId: string) => void
  },
  ThunkConfig
>(
  "projects/create",
  async ({ organizationId, payload }, { extra: { services } }) =>
    await services.projects.createOne(organizationId, payload),
)

export const listProjects = createAsyncThunk<Project[], { organizationId: string }, ThunkConfig>(
  "projects/list",
  async ({ organizationId }, { extra: { services } }) =>
    await services.projects.getAll(organizationId),
)

export const updateProject = createAsyncThunk<
  void,
  { organizationId: string; projectId: string; payload: UpdateProjectPayload },
  ThunkConfig
>(
  "projects/update",
  async ({ organizationId, projectId, payload }, { extra: { services } }) =>
    await services.projects.updateOne(organizationId, projectId, payload),
)

export const deleteProject = createAsyncThunk<
  void,
  { organizationId: string; projectId: string; onSuccess?: () => void },
  ThunkConfig
>(
  "projects/delete",
  async ({ organizationId, projectId }, { extra: { services } }) =>
    await services.projects.deleteOne(organizationId, projectId),
)
