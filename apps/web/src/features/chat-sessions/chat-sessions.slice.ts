import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { ChatBot } from "../chat-bots/chat-bots.models"
import { initOrganization } from "../global.thunks"
import type { AgentSession, AgentSessionMessage } from "./chat-sessions.models"
import { listSessions, loadSessionMessages } from "./chat-sessions.thunks"

type DataType = Record<ChatBot["id"], AgentSession[]> // keyed by chatBotId
type State = {
  currentChatSessionId: string | null
  data: AsyncData<DataType>
  messages: AsyncData<AgentSessionMessage[]>
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
      state.currentChatSessionId = action.payload.chatSessionId
    },
    reset: () => initialState,
    startStreaming: (
      state,
      action: PayloadAction<{ userMessage: AgentSessionMessage; assistantMessageId: string }>,
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
      .addCase(initOrganization.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(initOrganization.fulfilled, (state, action) => {
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: Object.values(action.payload.chatBots)
            .flat()
            .reduce((acc, chatBot) => {
              acc[chatBot.id] = action.payload.chatSessions[chatBot.id] || []
              return acc
            }, {} as DataType),
        }
      })
      .addCase(initOrganization.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list chat bots"
      })

    builder
      .addCase(listSessions.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listSessions.fulfilled, (state, action) => {
        const chatBotId = action.meta.arg.agentId
        state.data = {
          value: {
            ...state.data.value,
            [chatBotId]: action.payload,
          },
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
        if (!ADS.isFulfilled(state.messages)) state.messages.status = ADS.Loading
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
