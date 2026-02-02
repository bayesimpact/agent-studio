import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import { selectCurrentProjectId } from "../projects/projects.selectors"
import type { ChatBot } from "./chat-bots.models"

export const selectChatBotsStatus = (state: RootState) => state.chatBots.data.status

export const selectChatBotsError = (state: RootState) => state.chatBots.data.error

const selectChatBotsData = (state: RootState) => state.chatBots.data

const missingProjectId = { status: ADS.Error, value: null, error: "No project selected" }
const missingChatBots = { status: ADS.Error, value: null, error: "No chat bots available" }

export const selectChatBotsFromProjectId = (projectId?: string | null) =>
  createSelector([selectChatBotsData], (chatBotsData): AsyncData<ChatBot[]> => {
    if (!projectId) return missingProjectId

    if (!ADS.isFulfilled(chatBotsData)) return { ...chatBotsData }

    if (!chatBotsData.value?.[projectId]) return missingChatBots

    return { status: ADS.Fulfilled, value: chatBotsData.value[projectId], error: null }
  })

export const selectCurrentChatBotId = (state: RootState) => state.chatBots.currentChatBotId

export const selectCurrentChatBotsData = createSelector(
  [selectCurrentProjectId, selectChatBotsData],
  (projectId, chatBotsData): AsyncData<ChatBot[]> => {
    if (!projectId) return missingProjectId

    if (!ADS.isFulfilled(chatBotsData)) return { ...chatBotsData }

    if (!chatBotsData.value?.[projectId]) return missingChatBots

    return { status: ADS.Fulfilled, value: chatBotsData.value[projectId], error: null }
  },
)

export const selectChatBotData = createSelector(
  [selectCurrentChatBotsData, selectCurrentChatBotId],
  (chatBotsData, chatBotId): AsyncData<ChatBot> => {
    if (!chatBotId) return { status: ADS.Error, value: null, error: "No chat bot selected" }
    if (!ADS.isFulfilled(chatBotsData)) return { ...chatBotsData }
    const chatBot = chatBotsData.value.find((cb) => cb.id === chatBotId)
    if (!chatBot)
      return { status: ADS.Error, value: null, error: "Chat bot not found in current project" }
    return { status: ADS.Fulfilled, value: chatBot, error: null }
  },
)
