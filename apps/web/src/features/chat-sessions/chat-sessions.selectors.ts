import type { RootState } from "@/store"

export const selectChatSessionStatus = (state: RootState) => state.chatSession.data.status

export const selectChatSessionError = (state: RootState) => state.chatSession.data.error

export const selectCurrentChatSession = (state: RootState) => state.chatSession.data.value

export const selectCurrentMessages = (state: RootState) => state.chatSession.messages.value

export const selectChatSessionMessagesStatus = (state: RootState) =>
  state.chatSession.messages.status

export const selectChatSessionMessagesError = (state: RootState) => state.chatSession.messages.error

export const selectStreaming = (state: RootState) => state.chatSession.isStreaming
