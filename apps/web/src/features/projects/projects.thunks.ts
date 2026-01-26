import type {
  CreateProjectRequestDto,
  UpdateProjectRequestDto,
} from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import type { Services } from "@/di/services"
import type { RootState, ThunkExtraArg } from "@/store"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const createProject = createAsyncThunk<
  { data: Awaited<ReturnType<Services["projects"]["createProject"]>> },
  CreateProjectRequestDto,
  ThunkConfig
>("projects/create", async (payload, { extra }) => {
  const data = await extra.services.projects.createProject(payload)
  return { data }
})

export const listProjects = createAsyncThunk<
  { data: Awaited<ReturnType<Services["projects"]["listProjects"]>> },
  string,
  ThunkConfig
>("projects/list", async (organizationId, { extra }) => {
  const data = await extra.services.projects.listProjects(organizationId)
  return { data }
})

export const updateProject = createAsyncThunk<
  void,
  { projectId: string; payload: UpdateProjectRequestDto },
  ThunkConfig
>("projects/update", async ({ projectId, payload }, { extra }) => {
  await extra.services.projects.updateProject(projectId, payload)
})

export const deleteProject = createAsyncThunk<string, string, ThunkConfig>(
  "projects/delete",
  async (projectId, { extra }) => {
    await extra.services.projects.deleteProject(projectId)
    return projectId
  },
)
