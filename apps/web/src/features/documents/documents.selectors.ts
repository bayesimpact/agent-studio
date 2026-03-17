import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import type { Document } from "./documents.models"

export const selectDocumentsStatus = (state: RootState) => state.documents.data.status

export const selectDocumentsError = (state: RootState) => state.documents.data.error

export const selectDocumentsData = (state: RootState) => state.documents.data

export const selectCurrentDocumentId = (state: RootState) => state.documents.currentDocumentId

export const selectDocumentData = createSelector(
  [selectDocumentsData, selectCurrentDocumentId],
  (documentsData, documentId): AsyncData<Document> => {
    if (!documentId) return { status: ADS.Error, value: null, error: "No document selected" }
    if (!ADS.isFulfilled(documentsData)) return { ...documentsData }
    const document = documentsData.value.find((r) => r.id === documentId)
    if (!document)
      return { status: ADS.Error, value: null, error: "Document not found in current project" }
    return { status: ADS.Fulfilled, value: document, error: null }
  },
)

export const selectUploaderState = (state: RootState) => state.documents.uploader
