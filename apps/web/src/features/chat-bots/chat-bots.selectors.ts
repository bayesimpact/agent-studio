import type { RootState } from "@/store"

export const selectCreatedChatBot = (state: RootState) => state.chatBots.createdChatBot
export const selectChatBotsStatus = (state: RootState) => state.chatBots.status
export const selectChatBotsError = (state: RootState) => state.chatBots.error

export const selectChatBots = (projectId?: string) => (state: RootState) =>
  (projectId && state.chatBots.chatBots[projectId]) || null

export const selectCurrentChatBot =
  ({ projectId, chatBotId }: { projectId?: string; chatBotId?: string }) =>
  (state: RootState) =>
    (projectId &&
      chatBotId &&
      state.chatBots.chatBots[projectId]?.find((chatBot) => chatBot.id === chatBotId)) ||
    null
