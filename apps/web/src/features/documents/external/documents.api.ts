import {
  type DocumentDto,
  DocumentsRoutes,
  type PresignFileRequestItemDto,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
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
  uploadMany: async ({ organizationId, projectId, files, sourceType }) => {
    const axios = getAxiosInstance()

    // 1. Get signed upload URLs + create pending document entities
    const presignResponse = await axios.post<typeof DocumentsRoutes.presignMany.response>(
      DocumentsRoutes.presignMany.getPath({ organizationId, projectId, sourceType }),
      {
        payload: {
          files: files.map((file) => ({
            fileName: file.name,
            mimeType: file.type as PresignFileRequestItemDto["mimeType"],
            size: file.size,
          })),
        },
      } satisfies typeof DocumentsRoutes.presignMany.request,
    )
    const presigned = presignResponse.data.data

    // 2. Upload directly to GCS — fully parallel, no backend involved
    await Promise.all(
      presigned.map(({ uploadUrl }, index) => {
        const file = files[index]
        if (!file) throw new Error(`File for index ${index} is missing`)
        return fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        })
      }),
    )

    // 3. Confirm all at once — backend marks as uploaded and enqueues embeddings
    const confirmResponse = await axios.post<typeof DocumentsRoutes.confirmMany.response>(
      DocumentsRoutes.confirmMany.getPath({ organizationId, projectId }),
      {
        payload: { documentIds: presigned.map(({ documentId }) => documentId) },
      } satisfies typeof DocumentsRoutes.confirmMany.request,
    )
    return confirmResponse.data.data.map(toDocument)
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
    embeddingStatus: dto.embeddingStatus,
    title: dto.title,
    updatedAt: dto.updatedAt,
    tagIds: dto.tagIds,
  }
}
