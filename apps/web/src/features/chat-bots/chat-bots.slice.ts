import { createSlice } from "@reduxjs/toolkit"
import type { ChatBot } from "./chat-bots.models"
import { createChatBot, deleteChatBot, listChatBots, updateChatBot } from "./chat-bots.thunks"

interface ChatBotsState {
  chatBots: Record<string, ChatBot[] | null> // keyed by projectId
  createdChatBot: ChatBot | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: ChatBotsState = {
  chatBots: {},
  createdChatBot: null,
  status: "idle",
  error: null,
}

export const chatBotsSlice = createSlice({
  name: "chatBots",
  initialState,
  reducers: {
    clearChatBots: (state, action: { payload: string }) => {
      // Clear chat bots for a specific project
      delete state.chatBots[action.payload]
    },
    clearCreatedChatBot: (state) => {
      state.createdChatBot = null
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
        const projectId = action.meta.arg
        state.chatBots[projectId] = action.payload
        state.error = null
      })
      .addCase(listChatBots.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to list chat bots"
      })

    builder
      .addCase(createChatBot.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(createChatBot.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.createdChatBot = action.payload
        state.error = null
        // Add the new chat bot to the list
        const projectId = action.payload.projectId
        if (state.chatBots[projectId]) {
          state.chatBots[projectId].unshift(action.payload)
        }
      })
      .addCase(createChatBot.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to create chat bot"
      })

    builder
      .addCase(updateChatBot.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(updateChatBot.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        // Update the chat bot in the list
        const { chatBotId, payload } = action.meta.arg
        // Find which project this chat bot belongs to
        for (const projectId in state.chatBots) {
          if (state.chatBots[projectId]) {
            const chatBotIndex = state.chatBots[projectId].findIndex(
              (chatBot) => chatBot.id === chatBotId,
            )
            if (chatBotIndex !== -1) {
              const existingChatBot = state.chatBots[projectId][chatBotIndex]
              if (existingChatBot) {
                state.chatBots[projectId][chatBotIndex] = {
                  ...existingChatBot,
                  name: payload.name ?? existingChatBot.name,
                  defaultPrompt: payload.defaultPrompt ?? existingChatBot.defaultPrompt,
                  updatedAt: Date.now(),
                }
                break
              }
            }
          }
        }
      })
      .addCase(updateChatBot.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to update chat bot"
      })

    builder
      .addCase(deleteChatBot.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(deleteChatBot.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        // Remove the chat bot from the list
        // We need to find which project it belongs to and remove it from that project's list
        const deletedChatBotId = action.meta.arg
        for (const projectId in state.chatBots) {
          if (state.chatBots[projectId]) {
            state.chatBots[projectId] = state.chatBots[projectId].filter(
              (chatBot) => chatBot.id !== deletedChatBotId,
            )
          }
        }
      })
      .addCase(deleteChatBot.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to delete chat bot"
      })
  },
})

export const { clearChatBots } = chatBotsSlice.actions
