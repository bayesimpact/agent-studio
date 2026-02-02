import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { ChatSession, ChatSessionMessage } from "./chat-sessions.models"
import { listSessions, loadSessionMessages } from "./chat-sessions.thunks"

type State = {
  currentChatSessionId: string | null
  data: AsyncData<ChatSession[]>
  messages: AsyncData<ChatSessionMessage[]>
  isStreaming: boolean
}

const initialState: State = {
  currentChatSessionId: null,
  data: defaultAsyncData,
  messages: defaultAsyncData,
  isStreaming: false,
}

const slice = createSlice({
  name: "chatSessions",
  initialState,
  reducers: {
    setCurrentChatSessionId: (state, action: PayloadAction<{ chatSessionId: string | null }>) => {
      if (!ADS.isFulfilled(state.data)) return
      const found = state.data.value.find((s) => s.id === action.payload.chatSessionId)
      if (!found) return

      state.currentChatSessionId = action.payload.chatSessionId
    },
    reset: () => initialState,
    startStreaming: (
      state,
      action: PayloadAction<{ userMessage: ChatSessionMessage; assistantMessageId: string }>,
    ) => {
      if (!ADS.isFulfilled(state.messages))
        state.messages = { value: [], status: ADS.Fulfilled, error: null }

      state.isStreaming = true
      state.messages.value.push(action.payload.userMessage)
      state.messages.value.push({
        id: action.payload.assistantMessageId,
        role: "assistant",
        content: "",
        status: "streaming",
      })
    },
    updateAssistantMessageId: (
      state,
      action: PayloadAction<{ oldMessageId: string; newMessageId: string }>,
    ) => {
      if (!ADS.isFulfilled(state.messages)) return

      const message = state.messages.value.find((msg) => msg.id === action.payload.oldMessageId)
      if (message && message.role === "assistant" && message.status === "streaming") {
        message.id = action.payload.newMessageId
      }
    },
    appendAssistantChunk: (state, action: PayloadAction<{ messageId: string; chunk: string }>) => {
      if (!ADS.isFulfilled(state.messages)) return

      const message = state.messages.value.find((msg) => msg.id === action.payload.messageId)
      if (message && message.role === "assistant") {
        message.content += action.payload.chunk
      }
    },
    completeAssistantMessage: (
      state,
      action: PayloadAction<{ messageId: string; fullContent: string }>,
    ) => {
      if (!ADS.isFulfilled(state.messages)) return

      const message = state.messages.value.find((msg) => msg.id === action.payload.messageId)
      if (message && message.role === "assistant") {
        message.content = action.payload.fullContent
        message.status = "completed"
        if (message.completedAt === undefined) {
          message.completedAt = new Date().toISOString()
        }
      }
      state.isStreaming = false
    },
    failAssistantMessage: (state, action: PayloadAction<{ messageId: string; error: string }>) => {
      if (!ADS.isFulfilled(state.messages)) return

      const message = state.messages.value.find((msg) => msg.id === action.payload.messageId)
      if (message && message.role === "assistant") {
        message.status = "error"
        message.content = action.payload.error
        if (message.completedAt === undefined) {
          message.completedAt = new Date().toISOString()
        }
      }
      state.isStreaming = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listSessions.pending, (state) => {
        state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listSessions.fulfilled, (state, action) => {
        state.data = {
          value: action.payload,
          status: ADS.Fulfilled,
          error: null,
        }
        state.messages = defaultAsyncData
      })
      .addCase(listSessions.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to load sessions"
      })

    builder
      .addCase(loadSessionMessages.pending, (state) => {
        state.messages.status = ADS.Loading
        state.messages.error = null
      })
      .addCase(loadSessionMessages.fulfilled, (state, action) => {
        state.messages = {
          value: action.payload,
          status: ADS.Fulfilled,
          error: null,
        }
      })
      .addCase(loadSessionMessages.rejected, (state, action) => {
        state.messages.status = ADS.Error
        state.messages.error = action.error.message || "Failed to load session messages"
      })
  },
})

export type { State as ChatSessionsState }
export const chatSessionsInitialState = initialState
export const chatSessionsActions = { ...slice.actions }
export const chatSessionsSliceReducer = slice.reducer
