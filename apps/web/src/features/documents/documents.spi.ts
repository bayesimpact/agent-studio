import type { Document } from "./documents.models"

export interface IDocumentsSpi {
  getAll(params: { organizationId: string; projectId: string }): Promise<Document[]>
  uploadOne(params: {
    organizationId: string
    projectId: string
    file: File
    sourceType: "project" | "agentSessionMessage"
  }): Promise<Document>
  deleteOne(params: {
    organizationId: string
    projectId: string
    documentId: string
  }): Promise<void>
  getTemporaryUrl(params: {
    organizationId: string
    projectId: string
    documentId: string
  }): Promise<{ url: string }>
}
