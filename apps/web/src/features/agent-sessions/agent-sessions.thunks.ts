import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { generateId } from "@/utils/generate-id"
import { selectIsAdminInterface } from "../auth/auth.selectors"
import type { AgentSession, AgentSessionMessage } from "./agent-sessions.models"
import { agentSessionsActions } from "./agent-sessions.slice"
import { streamChatResponse } from "./external/agent-session-streaming"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listSessions = createAsyncThunk<
  AgentSession[],
  { agentId: string; playground: boolean },
  ThunkConfig
>("agentSession/listSessions", async ({ agentId, playground }, { extra: { services } }) => {
  if (playground) {
    return services.agentSessions.getAllPlayground(agentId)
  }
  return services.agentSessions.getAllApp(agentId)
})

export const createAgentSession = createAsyncThunk<
  AgentSession,
  { agentId: string; onSuccess?: (agentSessionId: string) => void },
  ThunkConfig
>("agentSession/createAgentSession", async (action, { extra: { services }, getState }) => {
  const state = getState()
  const isAdminInterface = selectIsAdminInterface(state)
  const agentId = action.agentId
  if (!agentId) {
    throw new Error("No current Agent ID found")
  }
  if (isAdminInterface) return services.agentSessions.createPlaygroundSession(agentId)
  return services.agentSessions.createAppSession({
    agentId,
    agentSessionType: "app-private",
  })
})

export const loadSessionMessages = createAsyncThunk<AgentSessionMessage[], string, ThunkConfig>(
  "agentSession/loadSessionMessages",
  async (sessionId, { extra: { services } }) => {
    return services.agentSessions.getMessages(sessionId)
  },
)

export const sendMessage = createAsyncThunk<
  void,
  { sessionId: string; content: string },
  ThunkConfig
>("agentSession/sendMessage", async ({ sessionId, content }, { dispatch, getState, signal }) => {
  const state = getState()
  const agentSessionsState = state.agentSessions

  // Guard: don't allow sending if already streaming
  if (agentSessionsState.isStreaming) {
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
  dispatch(agentSessionsActions.startStreaming({ userMessage, assistantMessageId }))

  try {
    // Stream the response
    await streamChatResponse(
      sessionId,
      content,
      {
        onStart: (event) => {
          // Update the optimistic message ID to match the backend's ID
          dispatch(
            agentSessionsActions.updateAssistantMessageId({
              oldMessageId: assistantMessageId,
              newMessageId: event.messageId,
            }),
          )
        },
        onChunk: (event) => {
          dispatch(
            agentSessionsActions.appendAssistantChunk({
              messageId: event.messageId,
              chunk: event.content,
            }),
          )
        },
        onEnd: (event) => {
          dispatch(
            agentSessionsActions.completeAssistantMessage({
              messageId: event.messageId,
              fullContent: event.fullContent,
            }),
          )
        },
        onError: (event) => {
          dispatch(
            agentSessionsActions.failAssistantMessage({
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
      agentSessionsActions.failAssistantMessage({
        messageId: assistantMessageId,
        error: errorMessage,
      }),
    )
    throw error
  }
})
