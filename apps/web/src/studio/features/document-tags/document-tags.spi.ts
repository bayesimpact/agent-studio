import type { DocumentTag } from "./document-tags.models"

export interface IDocumentTagsSpi {
  getAll: (params: { organizationId: string; projectId: string }) => Promise<DocumentTag[]>
  createOne: (
    params: { organizationId: string; projectId: string },
    payload: Pick<DocumentTag, "name"> & Partial<Pick<DocumentTag, "description" | "parentId">>,
  ) => Promise<DocumentTag>
  updateOne: (
    params: { organizationId: string; projectId: string; documentTagId: string },
    payload: Pick<DocumentTag, "name" | "description" | "parentId">,
  ) => Promise<void>
  deleteOne: (params: {
    organizationId: string
    projectId: string
    documentTagId: string
  }) => Promise<void>
}
