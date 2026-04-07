import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import type { DocumentTag } from "./document-tags.models"
import { selectDocumentTagsData } from "./document-tags.selectors"

export function getTagNameById(documentTags: DocumentTag[], tagId: string): string {
  const tagNameById = documentTags.find((tag) => tag.id === tagId)?.name ?? "Unknown Tag"
  return tagNameById
}

export function useDocumentTags(): { documentTags: DocumentTag[] } {
  const documentTagsData = useAppSelector(selectDocumentTagsData)
  const documentTags = ADS.isFulfilled(documentTagsData) ? documentTagsData.value : []
  return { documentTags }
}
