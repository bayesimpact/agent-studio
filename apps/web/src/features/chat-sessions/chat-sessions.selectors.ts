import type { RootState } from "@/store"
import { ADS } from "@/store/async-data-status"

export const selectChatSessionStatus = (state: RootState) => state.chatSessions.data.status

export const selectChatSessionError = (state: RootState) => state.chatSessions.data.error

export const selectChatSessions = (state: RootState) => state.chatSessions.data.value

export const selectCurrentChatSessionId = (state: RootState) =>
  state.chatSessions.currentChatSessionId

export const selectCurrentChatSession = (state: RootState) =>
  state.chatSessions.data.value?.find((session) => session.id === selectCurrentChatSessionId(state))

export const selectCurrentMessages = (state: RootState) => state.chatSessions.messages.value

export const selectChatSessionMessagesStatus = (state: RootState) =>
  state.chatSessions.messages.status

export const selectChatSessionMessagesError = (state: RootState) =>
  state.chatSessions.messages.error

export const selectStreaming = (state: RootState) => state.chatSessions.isStreaming

export const selectFirstSession = (state: RootState) => {
  const sessions = state.chatSessions.data
  if (!ADS.isFulfilled(sessions)) return null
  return sessions.value[0] || null
}
