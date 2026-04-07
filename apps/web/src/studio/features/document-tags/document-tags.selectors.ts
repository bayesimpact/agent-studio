import type { RootState } from "@/common/store"

export const selectDocumentTagsStatus = (state: RootState) => state.studio.documentTags.data.status

export const selectDocumentTagsError = (state: RootState) => state.studio.documentTags.data.error

export const selectDocumentTagsData = (state: RootState) => state.studio.documentTags.data
