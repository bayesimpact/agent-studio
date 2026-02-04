import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import type { ChatSession } from "./chat-sessions.models"

export const selectChatSessionStatus = (state: RootState) => state.chatSessions.data.status

export const selectChatSessionError = (state: RootState) => state.chatSessions.data.error

const selectChatSessionsData = (state: RootState) => state.chatSessions.data

const missingChatBotId = { status: ADS.Error, value: null, error: "No chat bot selected" }
const missingChatSessions = { status: ADS.Error, value: null, error: "No chat sessions available" }

export const selectChatSessionsFromChatBotId = (chatBotId?: string | null) =>
  createSelector([selectChatSessionsData], (chatSessionsData): AsyncData<ChatSession[]> => {
    if (!chatBotId) return missingChatBotId

    if (!ADS.isFulfilled(chatSessionsData)) return { ...chatSessionsData }

    if (!chatSessionsData.value?.[chatBotId]) return missingChatSessions

    return { status: ADS.Fulfilled, value: chatSessionsData.value[chatBotId], error: null }
  })

export const selectCurrentChatSessionId = (state: RootState) =>
  state.chatSessions.currentChatSessionId

export const selectCurrentChatSessionDataFromChatBotId = (chatBotId?: string | null) =>
  createSelector(
    [selectChatSessionsFromChatBotId(chatBotId), selectCurrentChatSessionId],
    (chatSessionsData, chatSessionId): AsyncData<ChatSession> => {
      if (!ADS.isFulfilled(chatSessionsData)) return { ...chatSessionsData }

      if (!chatSessionId)
        return { status: ADS.Error, value: null, error: "No chat session selected" }

      const chatSession = chatSessionsData.value.find((cs) => cs.id === chatSessionId)

      if (!chatSession)
        return {
          status: ADS.Error,
          value: null,
          error: "Chat session not found in current chat bot",
        }

      return { status: ADS.Fulfilled, value: chatSession, error: null }
    },
  )

export const selectCurrentMessagesData = (state: RootState) => state.chatSessions.messages
export const selectCurrentMessages = (state: RootState) => state.chatSessions.messages.value

export const selectChatSessionMessagesStatus = (state: RootState) =>
  state.chatSessions.messages.status

export const selectChatSessionMessagesError = (state: RootState) =>
  state.chatSessions.messages.error

export const selectStreaming = (state: RootState) => state.chatSessions.isStreaming

export const selectFirstSessionFromChatBotId = (chatBotId?: string) => (state: RootState) => {
  if (!chatBotId) return null
  const sessions = state.chatSessions.data
  if (!ADS.isFulfilled(sessions)) return null
  return sessions.value[chatBotId]?.[0] || null
}
