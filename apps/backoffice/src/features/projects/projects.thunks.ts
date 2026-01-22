import {
  type CreateProjectRequestDto,
  ProjectsRoutes,
  type UpdateProjectRequestDto,
} from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { selectAuthToken } from "@/features/auth/auth.selectors"
import type { RootState } from "@/store"
import { apiRequest } from "@/store/apiClient"

export const createProject = createAsyncThunk(
  "projects/create",
  async (payload: CreateProjectRequestDto, { getState }) => {
    const state = getState() as RootState
    const token = selectAuthToken(state)
    if (!token) {
      throw new Error("No authentication token available")
    }
    return apiRequest({ route: ProjectsRoutes.createProject, payload: { payload }, token })
  },
)

export const listProjects = createAsyncThunk(
  "projects/list",
  async (organizationId: string, { getState }) => {
    const state = getState() as RootState
    const token = selectAuthToken(state)
    if (!token) {
      throw new Error("No authentication token available")
    }
    return apiRequest({ route: ProjectsRoutes.listProjects, token, pathParams: { organizationId } })
  },
)

export const updateProject = createAsyncThunk(
  "projects/update",
  async (
    { projectId, payload }: { projectId: string; payload: UpdateProjectRequestDto },
    { getState },
  ) => {
    const state = getState() as RootState
    const token = selectAuthToken(state)
    if (!token) {
      throw new Error("No authentication token available")
    }
    return apiRequest({
      route: ProjectsRoutes.updateProject,
      payload: { payload },
      token,
      pathParams: { projectId },
    })
  },
)

export const deleteProject = createAsyncThunk(
  "projects/delete",
  async (projectId: string, { getState }) => {
    const state = getState() as RootState
    const token = selectAuthToken(state)
    if (!token) {
      throw new Error("No authentication token available")
    }
    return apiRequest({
      route: ProjectsRoutes.deleteProject,
      token,
      pathParams: { projectId },
    })
  },
)
