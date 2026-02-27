import { type ProjectDto, ProjectsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { Project } from "../projects.models"
import type { IProjectsSpi } from "../projects.spi"

export default {
  createOne: async ({ organizationId, payload }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ProjectsRoutes.createOne.response>(
      ProjectsRoutes.createOne.getPath({ organizationId }),
      { payload },
    )
    return fromDto(response.data.data)
  },
  getAll: async (organizationId: string) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ProjectsRoutes.getAll.response>(
      ProjectsRoutes.getAll.getPath({ organizationId }),
    )
    return response.data.data.map(fromDto)
  },
  updateOne: async ({ organizationId, projectId, payload }) => {
    const axios = getAxiosInstance()
    await axios.patch(ProjectsRoutes.updateOne.getPath({ organizationId, projectId }), { payload })
  },
  deleteOne: async ({ organizationId, projectId }) => {
    const axios = getAxiosInstance()
    await axios.delete(ProjectsRoutes.deleteOne.getPath({ organizationId, projectId }))
  },
} satisfies IProjectsSpi

const fromDto = (dto: ProjectDto): Project => ({
  id: dto.id,
  name: dto.name,
  organizationId: dto.organizationId,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
})
