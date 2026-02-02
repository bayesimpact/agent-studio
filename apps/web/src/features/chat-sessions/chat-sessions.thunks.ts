import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { generateId } from "@/utils/generate-id"
import type { ChatSession, ChatSessionMessage } from "./chat-sessions.models"
import { chatSessionsActions } from "./chat-sessions.slice"
import { streamChatResponse } from "./external/chat-session-streaming"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listSessions = createAsyncThunk<
  ChatSession[],
  { chatBotId: string; playground: boolean },
  ThunkConfig
>("chatSession/listSessions", async ({ chatBotId, playground }, { extra: { services } }) => {
  if (playground) {
    return services.chatSession.getAllPlayground(chatBotId)
  }
  return services.chatSession.getAllApp(chatBotId)
})

export const createPlaygroundSession = createAsyncThunk<
  ChatSession,
  { callback: (chatSessionId: string) => void },
  ThunkConfig
>("chatSession/createPlaygroundSession", async (_, { extra: { services }, getState }) => {
  const state = getState()
  const chatBotId = state.chatBots.currentChatBotId
  if (!chatBotId) {
    throw new Error("No current chat bot ID found")
  }
  return services.chatSession.createPlaygroundSession(chatBotId)
})

export const createAppSession = createAsyncThunk<
  ChatSession,
  { callback: (chatSessionId: string) => void },
  ThunkConfig
>("chatSession/createAppSession", async (_, { extra: { services }, getState }) => {
  const state = getState()
  const chatBotId = state.chatBots.currentChatBotId
  if (!chatBotId) {
    throw new Error("No current chat bot ID found")
  }
  return services.chatSession.createAppSession({
    chatBotId,
    chatSessionType: "app-private",
  })
})

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
  const chatSessionsState = state.chatSessions

  // Guard: don't allow sending if already streaming
  if (chatSessionsState.isStreaming) {
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
  dispatch(chatSessionsActions.startStreaming({ userMessage, assistantMessageId }))

  try {
    // Stream the response
    await streamChatResponse(
      sessionId,
      content,
      {
        onStart: (event) => {
          // Update the optimistic message ID to match the backend's ID
          dispatch(
            chatSessionsActions.updateAssistantMessageId({
              oldMessageId: assistantMessageId,
              newMessageId: event.messageId,
            }),
          )
        },
        onChunk: (event) => {
          dispatch(
            chatSessionsActions.appendAssistantChunk({
              messageId: event.messageId,
              chunk: event.content,
            }),
          )
        },
        onEnd: (event) => {
          dispatch(
            chatSessionsActions.completeAssistantMessage({
              messageId: event.messageId,
              fullContent: event.fullContent,
            }),
          )
        },
        onError: (event) => {
          dispatch(
            chatSessionsActions.failAssistantMessage({
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
      chatSessionsActions.failAssistantMessage({
        messageId: assistantMessageId,
        error: errorMessage,
      }),
    )
    throw error
  }
})
