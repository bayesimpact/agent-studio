import { createSlice, isAnyOf } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { ChatSession, ChatSessionMessage } from "./chat-session.models"
import {
  createAppSession,
  createPlaygroundSession,
  loadSessionMessages,
} from "./chat-session.thunks"

type State = {
  data: AsyncData<ChatSession>
  messages: AsyncData<ChatSessionMessage[]>
  isStreaming: boolean
}

const initialState: State = {
  data: defaultAsyncData,
  messages: defaultAsyncData,
  isStreaming: false,
}

export const chatSessionSlice = createSlice({
  name: "chatSession",
  initialState,
  reducers: {
    reset: () => initialState,
    startStreaming: (
      state,
      action: { payload: { userMessage: ChatSessionMessage; assistantMessageId: string } },
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
      action: { payload: { oldMessageId: string; newMessageId: string } },
    ) => {
      if (!ADS.isFulfilled(state.messages)) return

      const message = state.messages.value.find((msg) => msg.id === action.payload.oldMessageId)
      if (message && message.role === "assistant" && message.status === "streaming") {
        message.id = action.payload.newMessageId
      }
    },
    appendAssistantChunk: (state, action: { payload: { messageId: string; chunk: string } }) => {
      if (!ADS.isFulfilled(state.messages)) return

      const message = state.messages.value.find((msg) => msg.id === action.payload.messageId)
      if (message && message.role === "assistant") {
        message.content += action.payload.chunk
      }
    },
    completeAssistantMessage: (
      state,
      action: { payload: { messageId: string; fullContent: string } },
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
    failAssistantMessage: (state, action: { payload: { messageId: string; error: string } }) => {
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

    builder
      .addMatcher(isAnyOf(createPlaygroundSession.pending, createAppSession.pending), (state) => {
        state.data.status = ADS.Loading
        state.data.error = null
      })
      .addMatcher(
        isAnyOf(createPlaygroundSession.fulfilled, createAppSession.fulfilled),
        (state, action) => {
          state.data = {
            value: action.payload,
            status: ADS.Fulfilled,
            error: null,
          }
          state.messages = defaultAsyncData
        },
      )
      .addMatcher(
        isAnyOf(createPlaygroundSession.rejected, createAppSession.rejected),
        (state, action) => {
          state.data.status = ADS.Error
          state.data.error = action.error.message || "Failed to create session"
        },
      )
  },
})

export type { State as ChatSessionState }
export const chatSessionInitialState = initialState
export const chatSessionActions = { ...chatSessionSlice.actions }
export const chatSessionSliceReducer = chatSessionSlice.reducer
