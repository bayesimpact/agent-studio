import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { ChatBot } from "./chat-bots.models"
import { listChatBots } from "./chat-bots.thunks"

interface State {
  currentChatBotId: string | null
  chatBots: Record<string, ChatBot[] | null> // keyed by projectId
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: State = {
  currentChatBotId: null,
  chatBots: {},
  status: "idle",
  error: null,
}

const slice = createSlice({
  name: "chatBots",
  initialState,
  reducers: {
    setCurrentChatBotId: (state, action: PayloadAction<{ chatBotId: string | null }>) => {
      state.currentChatBotId = action.payload.chatBotId
    },
    clearChatBots: (state, action: PayloadAction<{ projectId: string }>) => {
      // Clear chat bots for a specific project
      delete state.chatBots[action.payload.projectId]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listChatBots.pending, (state) => {
        if (state.status !== "succeeded") state.status = "loading"
        state.error = null
      })
      .addCase(listChatBots.fulfilled, (state, action) => {
        state.status = "succeeded"
        const projectId = action.meta.arg.projectId
        state.chatBots[projectId] = action.payload
        state.error = null
      })
      .addCase(listChatBots.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to list chat bots"
      })
  },
})

export type { State as ChatBotsState }
export const chatBotsInitialState = initialState
export const chatBotsActions = { ...slice.actions }
export const chatBotsSliceReducer = slice.reducer
