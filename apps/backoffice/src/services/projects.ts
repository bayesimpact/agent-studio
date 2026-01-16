import {
  ApiRoutes,
  type CreateProjectRequestDto,
  type CreateProjectResponseDto,
  type ListProjectsResponseDto,
} from "@caseai-connect/api-contracts"
import type { AxiosError, AxiosInstance } from "axios"

export interface IProjectsApi {
  createProject: (payload: CreateProjectRequestDto) => Promise<CreateProjectResponseDto>
  listProjects: (organizationId: string) => Promise<ListProjectsResponseDto>
}

export const buildProjectsApi = (axios: AxiosInstance): IProjectsApi => ({
  createProject: async (payload: CreateProjectRequestDto) => {
    try {
      const response = await axios.post<typeof ApiRoutes.ProjectsRoutes.createProject.response>(
        ApiRoutes.ProjectsRoutes.createProject.getPath(),
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
      const response = await axios.get<typeof ApiRoutes.ProjectsRoutes.listProjects.response>(
        ApiRoutes.ProjectsRoutes.listProjects.getPath({
          organizationId,
        }),
      )
      return response.data.data
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
})
