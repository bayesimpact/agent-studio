import {
  type CreateProjectRequestDto,
  ProjectsRoutes,
  type UpdateProjectRequestDto,
} from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { apiRequestWithAuth } from "@/services/apiClientWithAuth"

export const createProject = createAsyncThunk(
  "projects/create",
  async (payload: CreateProjectRequestDto) => {
    return apiRequestWithAuth({
      route: ProjectsRoutes.createProject,
      payload: { payload },
    })
  },
)

export const listProjects = createAsyncThunk("projects/list", async (organizationId: string) => {
  return apiRequestWithAuth({
    route: ProjectsRoutes.listProjects,
    pathParams: { organizationId },
  })
})

export const updateProject = createAsyncThunk(
  "projects/update",
  async ({ projectId, payload }: { projectId: string; payload: UpdateProjectRequestDto }) => {
    return apiRequestWithAuth({
      route: ProjectsRoutes.updateProject,
      payload: { payload },
      pathParams: { projectId },
    })
  },
)

export const deleteProject = createAsyncThunk("projects/delete", async (projectId: string) => {
  return apiRequestWithAuth({
    route: ProjectsRoutes.deleteProject,
    pathParams: { projectId },
  })
})
