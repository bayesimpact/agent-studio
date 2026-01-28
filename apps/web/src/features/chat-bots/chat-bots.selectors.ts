import type { RootState } from "@/store"
import { selectCurrentProjectId } from "../projects/projects.selectors"

export const selectChatBotsStatus = (state: RootState) => state.chatBots.status

export const selectChatBotsError = (state: RootState) => state.chatBots.error

export const selectChatBots = (state: RootState) => {
  const projectId = selectCurrentProjectId(state)
  if (!projectId) return null
  return state.chatBots.chatBots[projectId] || null
}

export const selectCurrentChatBotId = (state: RootState) => state.chatBots.currentChatBotId

export const selectCurrentChatBot = (state: RootState) => {
  const projectId = selectCurrentProjectId(state)
  if (!projectId) return null
  const chatBotId = selectCurrentChatBotId(state)
  if (!chatBotId) return null
  return state.chatBots.chatBots[projectId]?.find((chatBot) => chatBot.id === chatBotId) || null
}
