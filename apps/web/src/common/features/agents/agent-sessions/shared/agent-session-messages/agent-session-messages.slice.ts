import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/common/store/async-data-status"
import type { AgentSessionMessage } from "./agent-session-messages.models"
import { listMessages } from "./agent-session-messages.thunks"

type State = {
  data: AsyncData<AgentSessionMessage[]>
  isStreaming: boolean
}

const initialState: State = {
  data: defaultAsyncData,
  isStreaming: false,
}

const slice = createSlice({
  name: "agentSessionMessages",
  initialState,
  reducers: {
    reset: () => initialState,
    startStreaming: (
      state,
      action: PayloadAction<{
        userMessage: AgentSessionMessage
        assistantMessageId: string
      }>,
    ) => {
      if (!ADS.isFulfilled(state.data))
        state.data = { value: [], status: ADS.Fulfilled, error: null }

      state.isStreaming = true
      state.data.value.push(action.payload.userMessage)
      state.data.value.push({
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
      if (!ADS.isFulfilled(state.data)) return

      const message = state.data.value.find((msg) => msg.id === action.payload.oldMessageId)
      if (message && message.role === "assistant" && message.status === "streaming") {
        message.id = action.payload.newMessageId
      }
    },
    appendAssistantChunk: (state, action: PayloadAction<{ messageId: string; chunk: string }>) => {
      if (!ADS.isFulfilled(state.data)) return

      const message = state.data.value.find((msg) => msg.id === action.payload.messageId)
      if (message && message.role === "assistant") {
        message.content += action.payload.chunk
      }
    },
    completeAssistantMessage: (
      state,
      action: PayloadAction<{ messageId: string; fullContent: string }>,
    ) => {
      if (!ADS.isFulfilled(state.data)) return

      const message = state.data.value.find((msg) => msg.id === action.payload.messageId)
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
      if (!ADS.isFulfilled(state.data)) return

      const message = state.data.value.find((msg) => msg.id === action.payload.messageId)
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
      .addCase(listMessages.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listMessages.fulfilled, (state, action) => {
        const originalMessages = action.payload
        const mergedMessages: AgentSessionMessage[] = []
        originalMessages.forEach((msg) => {
          if (msg.role === "tool") {
            const lastMessage = mergedMessages[mergedMessages.length - 1]
            if (!lastMessage || lastMessage.role !== "assistant") return
            // Merge tool calls into the last message
            lastMessage.toolCalls = [...(lastMessage.toolCalls || []), ...(msg.toolCalls || [])]
            return
          }
          mergedMessages.push(msg)
        })
        state.data = {
          value: mergedMessages,
          status: ADS.Fulfilled,
          error: null,
        }
      })
      .addCase(listMessages.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to load session messages"
      })
  },
})

export type { State as agentSessionMessagesState }
export const agentSessionMessagesInitialState = initialState
export const agentSessionMessagesActions = { ...slice.actions }
export const agentSessionMessagesSlice = slice
