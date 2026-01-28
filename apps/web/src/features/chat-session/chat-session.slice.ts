import { createSlice } from "@reduxjs/toolkit"
import type { ChatSessionState } from "./chat-session.models"
import { createPlaygroundSession, loadSessionMessages } from "./chat-session.thunks"

const initialState: ChatSessionState = {
  session: null,
  activeChatBotId: null,
  messages: [],
  status: "idle",
  error: null,
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

export const { clearChatSession } = chatSessionSlice.actions
export const chatSessionActions = { ...chatSessionSlice.actions }
export const chatSessionSliceReducer = chatSessionSlice.reducer
