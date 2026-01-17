import { type CreateProjectRequestDto, ProjectsRoutes } from "@caseai-connect/api-contracts"
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
    return apiRequest(ProjectsRoutes.createProject, { payload }, token)
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
    return apiRequest(ProjectsRoutes.listProjects, undefined, token, { organizationId })
  },
)
