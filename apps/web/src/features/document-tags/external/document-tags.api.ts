import { type DocumentTagDto, DocumentTagsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { DocumentTag } from "../document-tags.models"
import type { IDocumentTagsSpi } from "../document-tags.spi"

export default {
  getAll: async ({ organizationId, projectId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof DocumentTagsRoutes.getAll.response>(
      DocumentTagsRoutes.getAll.getPath({ organizationId, projectId }),
    )
    return response.data.data.map(fromDto)
  },
  getOne: async ({ organizationId, projectId, documentTagId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof DocumentTagsRoutes.getOne.response>(
      DocumentTagsRoutes.getOne.getPath({ organizationId, projectId, documentTagId }),
    )
    return fromDto(response.data.data)
  },
  createOne: async ({ organizationId, projectId }, payload) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof DocumentTagsRoutes.createOne.response>(
      DocumentTagsRoutes.createOne.getPath({ organizationId, projectId }),
      { payload: toCreateDto(payload) },
    )
    return fromDto(response.data.data)
  },
  updateOne: async ({ organizationId, projectId, documentTagId }, payload) => {
    const axios = getAxiosInstance()
    await axios.patch(
      DocumentTagsRoutes.updateOne.getPath({ organizationId, projectId, documentTagId }),
      { payload: toUpdateDto(payload) },
    )
  },
  deleteOne: async ({ organizationId, projectId, documentTagId }) => {
    const axios = getAxiosInstance()
    await axios.delete(
      DocumentTagsRoutes.deleteOne.getPath({ organizationId, projectId, documentTagId }),
    )
  },
} satisfies IDocumentTagsSpi

const toCreateDto = (
  payload: Pick<DocumentTag, "name"> & Partial<Pick<DocumentTag, "description" | "parentId">>,
): (typeof DocumentTagsRoutes.createOne.request)["payload"] => ({
  name: payload.name,
  description: payload.description,
  parentId: payload.parentId,
})

const toUpdateDto = (
  payload: Partial<Pick<DocumentTag, "name" | "description" | "parentId">>,
): (typeof DocumentTagsRoutes.updateOne.request)["payload"] => ({
  name: payload.name,
  description: payload.description,
  parentId: payload.parentId,
})

const fromDto = (dto: DocumentTagDto): DocumentTag => ({
  createdAt: dto.createdAt,
  description: dto.description,
  id: dto.id,
  name: dto.name,
  organizationId: dto.organizationId,
  parentId: dto.parentId,
  projectId: dto.projectId,
  updatedAt: dto.updatedAt,
})
