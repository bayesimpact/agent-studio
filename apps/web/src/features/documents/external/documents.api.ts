import { type DocumentDto, DocumentsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import { toDocumentTag } from "@/features/document-tags/external/document-tags.api"
import type { Document } from "../documents.models"
import type { IDocumentsSpi } from "../documents.spi"

export default {
  getAll: async ({ organizationId, projectId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof DocumentsRoutes.getAll.response>(
      DocumentsRoutes.getAll.getPath({ organizationId, projectId }),
    )
    return response.data.data.map(toDocument)
  },
  uploadOne: async ({ organizationId, projectId, file, sourceType }) => {
    const axios = getAxiosInstance()

    const formData = new FormData()
    formData.append("file", file)

    const response = await axios.post<typeof DocumentsRoutes.uploadOne.response>(
      DocumentsRoutes.uploadOne.getPath({ organizationId, projectId, sourceType }),
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    )
    return toDocument(response.data.data)
  },
  updateOne: async ({ organizationId, projectId, documentId, payload }) => {
    const axios = getAxiosInstance()
    await axios.patch<typeof DocumentsRoutes.updateOne>(
      DocumentsRoutes.updateOne.getPath({ organizationId, projectId, documentId }),
      { payload } satisfies typeof DocumentsRoutes.updateOne.request,
    )
  },
  deleteOne: async (params) => {
    const axios = getAxiosInstance()
    await axios.delete<typeof DocumentsRoutes.deleteOne>(DocumentsRoutes.deleteOne.getPath(params))
  },
  getTemporaryUrl: async (params) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof DocumentsRoutes.getTemporaryUrl.response>(
      DocumentsRoutes.getTemporaryUrl.getPath(params),
    )
    return response.data.data
  },
} satisfies IDocumentsSpi

function toDocument(dto: DocumentDto): Document {
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
    tags: dto.tags.map(toDocumentTag),
  }
}
