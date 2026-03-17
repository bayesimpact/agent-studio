import type { DocumentTagsUpdateFields } from "../document-tags/document-tags.models"
import type { Document } from "./documents.models"

export interface IDocumentsSpi {
  getAll(params: { organizationId: string; projectId: string }): Promise<Document[]>
  uploadOne(params: {
    organizationId: string
    projectId: string
    file: File
    sourceType: "project" | "agentSessionMessage" | "extraction"
  }): Promise<Document>
  uploadMany(params: {
    organizationId: string
    projectId: string
    files: File[]
    sourceType: "project" | "agentSessionMessage" | "extraction"
  }): Promise<Document[]>
  updateOne(params: {
    organizationId: string
    projectId: string
    documentId: string
    payload: Partial<Pick<Document, "title">> & DocumentTagsUpdateFields
  }): Promise<void>
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
