import type {
  CreateChatBotResponseDto,
  ListChatBotsResponseDto,
} from "@caseai-connect/api-contracts"
import { createSlice } from "@reduxjs/toolkit"
import { createChatBot, deleteChatBot, listChatBots, updateChatBot } from "./chat-bots.thunks"

interface ChatBotsState {
  chatBots: Record<string, ListChatBotsResponseDto | null> // keyed by projectId
  createdChatBot: CreateChatBotResponseDto | null
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
      // Clear chat templates for a specific project
      delete state.chatBots[action.payload]
    },
    clearCreatedChatBot: (state) => {
      state.createdChatBot = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listChatBots.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(listChatBots.fulfilled, (state, action) => {
        state.status = "succeeded"
        const projectId = action.meta.arg
        state.chatBots[projectId] = action.payload.data
        state.error = null
      })
      .addCase(listChatBots.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to list chat templates"
      })
      .addCase(createChatBot.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(createChatBot.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.createdChatBot = action.payload.data
        state.error = null
        // Add the new chat template to the list
        const projectId = action.payload.data.projectId
        if (state.chatBots[projectId]?.chatBots) {
          state.chatBots[projectId]!.chatBots.unshift({
            id: action.payload.data.id,
            name: action.payload.data.name,
            defaultPrompt: action.payload.data.defaultPrompt,
            projectId: action.payload.data.projectId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        }
      })
      .addCase(createChatBot.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to create chat template"
      })
      .addCase(updateChatBot.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(updateChatBot.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        // Update the chat template in the list
        const { chatBotId, payload } = action.meta.arg
        // Find which project this chat bot belongs to
        for (const projectId in state.chatBots) {
          if (state.chatBots[projectId]?.chatBots) {
            const templateIndex = state.chatBots[projectId]!.chatBots.findIndex(
              (t) => t.id === chatBotId,
            )
            if (templateIndex !== -1) {
              const existingTemplate = state.chatBots[projectId]!.chatBots[templateIndex]
              if (existingTemplate) {
                state.chatBots[projectId]!.chatBots[templateIndex] = {
                  id: existingTemplate.id,
                  name: payload.name ?? existingTemplate.name,
                  defaultPrompt: payload.defaultPrompt ?? existingTemplate.defaultPrompt,
                  projectId: existingTemplate.projectId,
                  createdAt: existingTemplate.createdAt,
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
        state.error = action.error.message || "Failed to update chat template"
      })
      .addCase(deleteChatBot.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(deleteChatBot.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        // Remove the chat template from the list
        // We need to find which project it belongs to and remove it from that project's list
        const deletedTemplateId = action.meta.arg
        for (const projectId in state.chatBots) {
          if (state.chatBots[projectId]?.chatBots) {
            state.chatBots[projectId]!.chatBots = state.chatBots[projectId]!.chatBots.filter(
              (t) => t.id !== deletedTemplateId,
            )
          }
        }
      })
      .addCase(deleteChatBot.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to delete chat template"
      })
  },
})

export const { clearChatBots } = chatBotsSlice.actions
