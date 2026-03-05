export type CreateDocumentEmbeddingsJobPayload = {
  documentId: string
  organizationId: string
  projectId: string
  uploadedByUserId: string
  origin: "document-upload"
  currentTraceId: string
}
