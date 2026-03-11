import type { RootState } from "@/store"

export const selectDocumentTagsStatus = (state: RootState) => state.documentTags.data.status

export const selectDocumentTagsError = (state: RootState) => state.documentTags.data.error

export const selectDocumentTagsData = (state: RootState) => state.documentTags.data
