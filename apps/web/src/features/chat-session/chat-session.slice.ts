import { createSlice } from "@reduxjs/toolkit"
import type { ChatSessionMessage, ChatSessionState } from "./chat-session.models"
import { createPlaygroundSession, loadSessionMessages } from "./chat-session.thunks"

const initialState: ChatSessionState = {
  session: null,
  activeChatBotId: null,
  messages: [],
  status: "idle",
  error: null,
  isStreaming: false,
  currentAssistantMessageId: null,
}

export const chatSessionSlice = createSlice({
  name: "chatSession",
  initialState,
  reducers: {
    clearChatSession: (state) => {
      state.session = null
      state.activeChatBotId = null
      state.messages = []
      state.status = "idle"
      state.error = null
      state.isStreaming = false
      state.currentAssistantMessageId = null
    },
    startStreaming: (
      state,
      action: { payload: { userMessage: ChatSessionMessage; assistantMessageId: string } },
    ) => {
      state.isStreaming = true
      state.currentAssistantMessageId = action.payload.assistantMessageId
      state.messages.push(action.payload.userMessage)
      state.messages.push({
        id: action.payload.assistantMessageId,
        role: "assistant",
        content: "",
        status: "streaming",
      })
    },
    updateAssistantMessageId: (
      state,
      action: { payload: { oldMessageId: string; newMessageId: string } },
    ) => {
      const message = state.messages.find((msg) => msg.id === action.payload.oldMessageId)
      if (message && message.role === "assistant" && message.status === "streaming") {
        message.id = action.payload.newMessageId
        state.currentAssistantMessageId = action.payload.newMessageId
      }
    },
    appendAssistantChunk: (state, action: { payload: { messageId: string; chunk: string } }) => {
      const message = state.messages.find((msg) => msg.id === action.payload.messageId)
      if (message && message.role === "assistant") {
        message.content += action.payload.chunk
      }
    },
    completeAssistantMessage: (
      state,
      action: { payload: { messageId: string; fullContent: string } },
    ) => {
      const message = state.messages.find((msg) => msg.id === action.payload.messageId)
      if (message && message.role === "assistant") {
        message.content = action.payload.fullContent
        message.status = "completed"
        if (message.completedAt === undefined) {
          message.completedAt = new Date().toISOString()
        }
      }
      state.isStreaming = false
      state.currentAssistantMessageId = null
    },
    failAssistantMessage: (state, action: { payload: { messageId: string; error: string } }) => {
      const message = state.messages.find((msg) => msg.id === action.payload.messageId)
      if (message && message.role === "assistant") {
        message.status = "error"
        message.content = action.payload.error
        if (message.completedAt === undefined) {
          message.completedAt = new Date().toISOString()
        }
      }
      state.isStreaming = false
      state.currentAssistantMessageId = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPlaygroundSession.pending, (state, action) => {
        state.status = "loading"
        state.error = null
        state.activeChatBotId = action.meta.arg
      })
      .addCase(createPlaygroundSession.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.session = action.payload
        state.error = null
        state.messages = []
      })
      .addCase(createPlaygroundSession.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to create playground session"
      })

    builder
      .addCase(loadSessionMessages.pending, (state) => {
        // Keep existing session but reflect loading state if needed
        if (state.status === "idle") {
          state.status = "loading"
        }
        state.error = null
      })
      .addCase(loadSessionMessages.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.messages = action.payload
        state.error = null
      })
      .addCase(loadSessionMessages.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to load session messages"
      })
  },
})

export const {
  clearChatSession,
  startStreaming,
  updateAssistantMessageId,
  appendAssistantChunk,
  completeAssistantMessage,
  failAssistantMessage,
} = chatSessionSlice.actions
export const chatSessionActions = { ...chatSessionSlice.actions }
export const chatSessionSliceReducer = chatSessionSlice.reducer
