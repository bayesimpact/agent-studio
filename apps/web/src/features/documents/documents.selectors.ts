import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import { selectCurrentProjectId } from "../projects/projects.selectors"
import type { Document } from "./documents.models"

export const selectDocumentsStatus = (state: RootState) => state.documents.data.status

export const selectDocumentsError = (state: RootState) => state.documents.data.error

export const selectDocumentsData = (state: RootState) => state.documents.data

const missingProjectId = { status: ADS.Error, value: null, error: "No project selected" }
const missingDocuments = { status: ADS.Error, value: null, error: "No documents available" }

export const selectDocumentsFromProjectId = (projectId?: string | null) =>
  createSelector([selectDocumentsData], (documentsData): AsyncData<Document[]> => {
    if (!projectId) return missingProjectId

    if (!ADS.isFulfilled(documentsData)) return { ...documentsData }

    if (!documentsData.value?.[projectId]) return missingDocuments

    return { status: ADS.Fulfilled, value: documentsData.value[projectId], error: null }
  })

export const selectCurrentDocumentId = (state: RootState) => state.documents.currentDocumentId

export const selectCurrentDocumentsData = createSelector(
  [selectCurrentProjectId, selectDocumentsData],
  (projectId, documentsData): AsyncData<Document[]> => {
    if (!projectId) return missingProjectId

    if (!ADS.isFulfilled(documentsData)) return { ...documentsData }

    if (!documentsData.value?.[projectId]) return missingDocuments

    return { status: ADS.Fulfilled, value: documentsData.value[projectId], error: null }
  },
)

export const selectDocumentData = createSelector(
  [selectCurrentDocumentsData, selectCurrentDocumentId],
  (documentsData, documentId): AsyncData<Document> => {
    if (!documentId) return { status: ADS.Error, value: null, error: "No document selected" }
    if (!ADS.isFulfilled(documentsData)) return { ...documentsData }
    const document = documentsData.value.find((r) => r.id === documentId)
    if (!document)
      return { status: ADS.Error, value: null, error: "Document not found in current project" }
    return { status: ADS.Fulfilled, value: document, error: null }
  },
)
