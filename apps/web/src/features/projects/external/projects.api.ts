import {
  type CreateProjectRequestDto,
  type CreateProjectResponseDto,
  type ListProjectsResponseDto,
  ProjectsRoutes,
  type UpdateProjectRequestDto,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { CreateProjectPayload, Project, UpdateProjectPayload } from "../projects.models"
import type { IProjectsSpi } from "../projects.spi"

export default {
  createOne: async (payload: CreateProjectPayload) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ProjectsRoutes.createProject.response>(
      ProjectsRoutes.createProject.getPath(),
      {
        payload: toCreateDto(payload),
      },
    )
    return fromCreateDto(response.data.data)
  },
  getAll: async (organizationId: string) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ProjectsRoutes.listProjects.response>(
      ProjectsRoutes.listProjects.getPath({ organizationId }),
    )
    return fromListDto(response.data.data)
  },
  updateOne: async (projectId: string, payload: UpdateProjectPayload) => {
    const axios = getAxiosInstance()
    await axios.patch(ProjectsRoutes.updateProject.getPath({ projectId }), {
      payload: toUpdateDto(payload),
    })
  },
  deleteOne: async (projectId: string) => {
    const axios = getAxiosInstance()
    await axios.delete(ProjectsRoutes.deleteProject.getPath({ projectId }))
  },
} satisfies IProjectsSpi

const toCreateDto = (payload: CreateProjectPayload): CreateProjectRequestDto => ({
  name: payload.name,
  organizationId: payload.organizationId,
})

const toUpdateDto = (payload: UpdateProjectPayload): UpdateProjectRequestDto => ({
  name: payload.name,
})

const fromCreateDto = (dto: CreateProjectResponseDto): Project => ({
  id: dto.id,
  name: dto.name,
  organizationId: dto.organizationId,
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

const fromListDto = (dto: ListProjectsResponseDto): Project[] =>
  dto.projects.map((project) => ({
    id: project.id,
    name: project.name,
    organizationId: project.organizationId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }))
