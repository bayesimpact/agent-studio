import type {
  CreateChatTemplateResponseDto,
  ListChatTemplatesResponseDto,
} from "@caseai-connect/api-contracts"
import { createSlice } from "@reduxjs/toolkit"
import {
  createChatTemplate,
  deleteChatTemplate,
  listChatTemplates,
  updateChatTemplate,
} from "./chat-templates.thunks"

interface ChatTemplatesState {
  chatTemplates: Record<string, ListChatTemplatesResponseDto | null> // keyed by projectId
  createdChatTemplate: CreateChatTemplateResponseDto | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: ChatTemplatesState = {
  chatTemplates: {},
  createdChatTemplate: null,
  status: "idle",
  error: null,
}

export const chatTemplatesSlice = createSlice({
  name: "chatTemplates",
  initialState,
  reducers: {
    clearChatTemplates: (state, action: { payload: string }) => {
      // Clear chat templates for a specific project
      delete state.chatTemplates[action.payload]
    },
    clearCreatedChatTemplate: (state) => {
      state.createdChatTemplate = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listChatTemplates.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(listChatTemplates.fulfilled, (state, action) => {
        state.status = "succeeded"
        const projectId = action.meta.arg
        state.chatTemplates[projectId] = action.payload.data
        state.error = null
      })
      .addCase(listChatTemplates.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to list chat templates"
      })
      .addCase(createChatTemplate.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(createChatTemplate.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.createdChatTemplate = action.payload.data
        state.error = null
        // Add the new chat template to the list
        const projectId = action.payload.data.projectId
        if (state.chatTemplates[projectId]?.chatTemplates) {
          state.chatTemplates[projectId]!.chatTemplates.unshift({
            id: action.payload.data.id,
            name: action.payload.data.name,
            defaultPrompt: action.payload.data.defaultPrompt,
            projectId: action.payload.data.projectId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        }
      })
      .addCase(createChatTemplate.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to create chat template"
      })
      .addCase(updateChatTemplate.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(updateChatTemplate.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        // Update the chat template in the list
        const updatedTemplate = action.payload.data
        const projectId = updatedTemplate.projectId
        if (state.chatTemplates[projectId]?.chatTemplates) {
          const templateIndex = state.chatTemplates[projectId]!.chatTemplates.findIndex(
            (t) => t.id === updatedTemplate.id,
          )
          if (templateIndex !== -1) {
            state.chatTemplates[projectId]!.chatTemplates[templateIndex] = {
              ...state.chatTemplates[projectId]!.chatTemplates[templateIndex],
              name: updatedTemplate.name,
              defaultPrompt: updatedTemplate.defaultPrompt,
              updatedAt: Date.now(),
            }
          }
        }
      })
      .addCase(updateChatTemplate.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to update chat template"
      })
      .addCase(deleteChatTemplate.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(deleteChatTemplate.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        // Remove the chat template from the list
        // We need to find which project it belongs to and remove it from that project's list
        const deletedTemplateId = action.meta.arg
        for (const projectId in state.chatTemplates) {
          if (state.chatTemplates[projectId]?.chatTemplates) {
            state.chatTemplates[projectId]!.chatTemplates = state.chatTemplates[
              projectId
            ]!.chatTemplates.filter((t) => t.id !== deletedTemplateId)
          }
        }
      })
      .addCase(deleteChatTemplate.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to delete chat template"
      })
  },
})

export const { clearChatTemplates } = chatTemplatesSlice.actions
