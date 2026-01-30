import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { generateId } from "@/utils/generate-id"
import type { ChatSession, ChatSessionMessage } from "./chat-session.models"
import { chatSessionActions } from "./chat-session.slice"
import { streamChatResponse } from "./external/chat-session-streaming"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const createPlaygroundSession = createAsyncThunk<ChatSession, void, ThunkConfig>(
  "chatSession/createPlaygroundSession",
  async (_, { extra: { services }, getState }) => {
    const state = getState()
    const chatBotId = state.chatBots.currentChatBotId
    if (!chatBotId) {
      throw new Error("No current chat bot ID found")
    }
    return services.chatSession.createPlaygroundSession(chatBotId)
  },
)

export const createAppSession = createAsyncThunk<ChatSession, void, ThunkConfig>(
  "chatSession/createAppSession",
  async (_, { extra: { services }, getState }) => {
    const state = getState()
    const chatBotId = state.chatBots.currentChatBotId
    if (!chatBotId) {
      throw new Error("No current chat bot ID found")
    }
    return services.chatSession.createAppSession({
      chatBotId,
      chatSessionType: "app-private",
    })
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
  const userMessageId = generateId()
  const assistantMessageId = generateId()

  // Create user message
  const userMessage: ChatSessionMessage = {
    id: userMessageId,
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  }

  // Dispatch start streaming action (adds both messages optimistically)
  dispatch(chatSessionActions.startStreaming({ userMessage, assistantMessageId }))

  try {
    // Stream the response
    await streamChatResponse(
      sessionId,
      content,
      {
        onStart: (event) => {
          // Update the optimistic message ID to match the backend's ID
          dispatch(
            chatSessionActions.updateAssistantMessageId({
              oldMessageId: assistantMessageId,
              newMessageId: event.messageId,
            }),
          )
        },
        onChunk: (event) => {
          dispatch(
            chatSessionActions.appendAssistantChunk({
              messageId: event.messageId,
              chunk: event.content,
            }),
          )
        },
        onEnd: (event) => {
          dispatch(
            chatSessionActions.completeAssistantMessage({
              messageId: event.messageId,
              fullContent: event.fullContent,
            }),
          )
        },
        onError: (event) => {
          dispatch(
            chatSessionActions.failAssistantMessage({
              messageId: event.messageId,
              error: event.error,
            }),
          )
        },
      },
      signal,
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to stream response"
    dispatch(
      chatSessionActions.failAssistantMessage({
        messageId: assistantMessageId,
        error: errorMessage,
      }),
    )
    throw error
  }
})
