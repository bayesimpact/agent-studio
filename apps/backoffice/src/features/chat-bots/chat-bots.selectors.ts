import type { RootState } from "@/store"

export const selectChatBots = (projectId: string) => (state: RootState) =>
  state.chatBots.chatBots[projectId] || null
export const selectCreatedChatBot = (state: RootState) => state.chatBots.createdChatBot
export const selectChatBotsStatus = (state: RootState) => state.chatBots.status
export const selectChatBotsError = (state: RootState) => state.chatBots.error
