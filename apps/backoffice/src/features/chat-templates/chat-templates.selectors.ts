import type { RootState } from "@/store"

export const selectChatTemplates = (state: RootState, projectId: string) =>
  state.chatTemplates.chatTemplates[projectId] || null
export const selectCreatedChatTemplate = (state: RootState) =>
  state.chatTemplates.createdChatTemplate
export const selectChatTemplatesStatus = (state: RootState) => state.chatTemplates.status
export const selectChatTemplatesError = (state: RootState) => state.chatTemplates.error
