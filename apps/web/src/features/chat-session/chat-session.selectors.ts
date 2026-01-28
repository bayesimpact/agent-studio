import type { RootState } from "@/store"

export const selectChatSessionStatus = (state: RootState) => state.chatSession.status

export const selectChatSessionError = (state: RootState) => state.chatSession.error
