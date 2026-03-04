import type { RootState } from "@/store"

export const selectCurrentMessagesData = (state: RootState) => state.agentSessionMessages.data

export const selectStreaming = (state: RootState) => state.agentSessionMessages.isStreaming
