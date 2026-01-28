import { createAsyncThunk } from "@reduxjs/toolkit"
import { v4 } from "uuid"
import type { RootState, ThunkExtraArg } from "@/store"
import type { ChatSession, ChatSessionMessage } from "./chat-session.models"
import {
  appendAssistantChunk,
  completeAssistantMessage,
  failAssistantMessage,
  startStreaming,
  updateAssistantMessageId,
} from "./chat-session.slice"
import { streamChatResponse } from "./external/chat-session-streaming"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const createPlaygroundSession = createAsyncThunk<ChatSession, string, ThunkConfig>(
  "chatSession/createPlaygroundSession",
  async (chatBotId, { extra: { services } }) => {
    return services.chatSession.createPlaygroundSession(chatBotId)
  },
)

export const loadSessionMessages = createAsyncThunk<ChatSessionMessage[], string, ThunkConfig>(
  "chatSession/loadSessionMessages",
  async (sessionId, { extra: { services } }) => {
    return services.chatSession.getMessages(sessionId)
  },
)

export const sendMessage = createAsyncThunk<
  void,
  { sessionId: string; content: string },
  ThunkConfig
>("chatSession/sendMessage", async ({ sessionId, content }, { dispatch, getState, signal }) => {
  const state = getState()
  const chatSessionState = state.chatSession

  // Guard: don't allow sending if already streaming
  if (chatSessionState.isStreaming) {
    return
  }

  // Generate IDs for user and assistant messages
  const userMessageId = v4()
  const assistantMessageId = v4()

  // Create user message
  const userMessage: ChatSessionMessage = {
    id: userMessageId,
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  }

  // Dispatch start streaming action (adds both messages optimistically)
  dispatch(startStreaming({ userMessage, assistantMessageId }))

  try {
    // Stream the response
    await streamChatResponse(
      sessionId,
      content,
      {
        onStart: (event) => {
          // Update the optimistic message ID to match the backend's ID
          dispatch(
            updateAssistantMessageId({
              oldMessageId: assistantMessageId,
              newMessageId: event.messageId,
            }),
          )
        },
        onChunk: (event) => {
          dispatch(appendAssistantChunk({ messageId: event.messageId, chunk: event.content }))
        },
        onEnd: (event) => {
          dispatch(
            completeAssistantMessage({
              messageId: event.messageId,
              fullContent: event.fullContent,
            }),
          )
        },
        onError: (event) => {
          dispatch(failAssistantMessage({ messageId: event.messageId, error: event.error }))
        },
      },
      signal,
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to stream response"
    dispatch(failAssistantMessage({ messageId: assistantMessageId, error: errorMessage }))
    throw error
  }
})
