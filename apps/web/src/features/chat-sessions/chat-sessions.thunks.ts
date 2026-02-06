import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { generateId } from "@/utils/generate-id"
import { selectIsAdminInterface } from "../auth/auth.selectors"
import type { AgentSession, AgentSessionMessage } from "./chat-sessions.models"
import { chatSessionsActions } from "./chat-sessions.slice"
import { streamChatResponse } from "./external/chat-session-streaming"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listSessions = createAsyncThunk<
  AgentSession[],
  { agentId: string; playground: boolean },
  ThunkConfig
>("chatSession/listSessions", async ({ agentId, playground }, { extra: { services } }) => {
  if (playground) {
    return services.chatSessions.getAllPlayground(agentId)
  }
  return services.chatSessions.getAllApp(agentId)
})

export const createChatSession = createAsyncThunk<
  AgentSession,
  { agentId: string; onSuccess?: (agentSessionId: string) => void },
  ThunkConfig
>("chatSession/createChatSession", async (action, { extra: { services }, getState }) => {
  const state = getState()
  const isAdminInterface = selectIsAdminInterface(state)
  const agentId = action.agentId
  if (!agentId) {
    throw new Error("No current chat bot ID found")
  }
  if (isAdminInterface) return services.chatSessions.createPlaygroundSession(agentId)
  return services.chatSessions.createAppSession({
    agentId,
    agentSessionType: "app-private",
  })
})

export const loadSessionMessages = createAsyncThunk<AgentSessionMessage[], string, ThunkConfig>(
  "chatSession/loadSessionMessages",
  async (sessionId, { extra: { services } }) => {
    return services.chatSessions.getMessages(sessionId)
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
  const userMessage: AgentSessionMessage = {
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
