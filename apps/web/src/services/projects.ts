import {
  type CreateProjectRequestDto,
  type CreateProjectResponseDto,
  type ListProjectsResponseDto,
  ProjectsRoutes,
  type UpdateProjectRequestDto,
} from "@caseai-connect/api-contracts"
import type { AxiosError, AxiosInstance } from "axios"

export interface IProjectsApi {
  createProject: (payload: CreateProjectRequestDto) => Promise<CreateProjectResponseDto>
  listProjects: (organizationId: string) => Promise<ListProjectsResponseDto>
  updateProject: (projectId: string, payload: UpdateProjectRequestDto) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
}

export const buildProjectsApi = (axios: AxiosInstance): IProjectsApi => ({
  createProject: async (payload: CreateProjectRequestDto) => {
    try {
      const response = await axios.post<typeof ProjectsRoutes.createProject.response>(
        ProjectsRoutes.createProject.getPath(),
        {
          payload,
        },
      )
      return response.data.data
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
  listProjects: async (organizationId: string) => {
    try {
      const response = await axios.get<typeof ProjectsRoutes.listProjects.response>(
        ProjectsRoutes.listProjects.getPath({
          organizationId,
        }),
      )
      return response.data.data
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
  updateProject: async (projectId: string, payload: UpdateProjectRequestDto) => {
    try {
      await axios.patch(ProjectsRoutes.updateProject.getPath({ projectId }), { payload })
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
  deleteProject: async (projectId: string) => {
    try {
      await axios.delete(ProjectsRoutes.deleteProject.getPath({ projectId }))
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
})
