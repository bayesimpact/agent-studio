import { ADS, type AsyncData } from "@/store/async-data-status"
import type { Document } from "./documents.models"

export function shouldTriggerResyncForUnknownDocumentEvent(params: {
  documentsData: AsyncData<Document[]>
  documentId: string
  hasTriggeredUnknownDocumentResync: boolean
}): boolean {
  const documentExistsInCurrentList =
    ADS.isFulfilled(params.documentsData) &&
    params.documentsData.value.some((document) => document.id === params.documentId)

  if (documentExistsInCurrentList) {
    return false
  }

  return !params.hasTriggeredUnknownDocumentResync
}
