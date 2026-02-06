import { type ResourceDto, ResourcesRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { Resource } from "../resources.models"
import type { IResourcesSpi } from "../resources.spi"

export default {
  getAll: async ({ organizationId, projectId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ResourcesRoutes.getAll.response>(
      ResourcesRoutes.getAll.getPath({ organizationId, projectId }),
    )
    return response.data.data.map(toResource)
  },
  uploadOne: async ({ organizationId, projectId, file }) => {
    const axios = getAxiosInstance()

    const formData = new FormData()
    formData.append("file", file)

    const response = await axios.post<typeof ResourcesRoutes.uploadOne.response>(
      ResourcesRoutes.uploadOne.getPath({ organizationId, projectId }),
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    )
    return toResource(response.data.data)
  },
} satisfies IResourcesSpi

function toResource(dto: ResourceDto): Resource {
  return {
    content: dto.content,
    createdAt: dto.createdAt,
    deletedAt: dto.deletedAt,
    fileName: dto.fileName,
    id: dto.id,
    language: dto.language,
    mimeType: dto.mimeType,
    projectId: dto.projectId,
    size: dto.size,
    storageRelativePath: dto.storageRelativePath,
    title: dto.title,
    updatedAt: dto.updatedAt,
  }
}
