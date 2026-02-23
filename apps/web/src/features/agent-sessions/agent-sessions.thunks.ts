import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { generateId } from "@/utils/generate-id"
import { selectIsAdminInterface } from "../auth/auth.selectors"
import { getCurrentIds } from "../helpers"
import type { AgentSession, AgentSessionMessage } from "./agent-sessions.models"
import { agentSessionsActions } from "./agent-sessions.slice"
import { streamChatResponse } from "./external/agent-session-streaming"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listSessions = createAsyncThunk<
  AgentSession[],
  { organizationId: string; projectId: string; agentId: string; playground: boolean },
  ThunkConfig
>(
  "agentSession/listSessions",
  async ({ organizationId, projectId, agentId, playground }, { extra: { services } }) => {
    if (playground) {
      return services.agentSessions.getAllPlaygroundSessions({ organizationId, projectId, agentId })
    }
    return services.agentSessions.getAllAppSessions({ organizationId, projectId, agentId })
  },
)

export const createAgentSession = createAsyncThunk<
  AgentSession,
  {
    organizationId: string
    projectId: string
    agentId: string
    onSuccess?: (agentSessionId: string) => void
  },
  ThunkConfig
>(
  "agentSession/createAgentSession",
  async ({ organizationId, projectId, agentId }, { extra: { services }, getState }) => {
    const state = getState()
    const isAdminInterface = selectIsAdminInterface(state)

    if (!agentId) {
      throw new Error("No current Agent ID found")
    }
    if (isAdminInterface)
      return services.agentSessions.createPlaygroundSession({ organizationId, projectId, agentId })
    return services.agentSessions.createAppSession({
      organizationId,
      projectId,
      agentId,
      agentSessionType: "app-private",
    })
  },
)

export const loadSessionMessages = createAsyncThunk<AgentSessionMessage[], string, ThunkConfig>(
  "agentSession/loadSessionMessages",
  async (agentSessionId, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId, agentId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId", "agentId"],
    })
    return services.agentSessions.getMessages({
      organizationId,
      projectId,
      agentId,
      agentSessionId,
    })
  },
)

export const sendMessage = createAsyncThunk<void, { content: string; file?: File }, ThunkConfig>(
  "agentSession/sendMessage",
  async ({ content, file }, { extra: { services }, dispatch, getState, signal }) => {
    const state = getState()
    const { organizationId, projectId, agentId, agentSessionId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId", "agentId", "agentSessionId"],
    })

    const agentSessionsState = state.agentSessions

    // Guard: don't allow sending if already streaming
    if (agentSessionsState.isStreaming) {
      return
    }

    const userMessageId = generateId()
    const assistantMessageId = generateId()

    let documentId: string | undefined

    if (file) {
      const document = await services.documents.uploadOne({
        organizationId,
        projectId,
        file,
        sourceType: "agentSessionMessage",
      })
      documentId = document.id
    }

    const userMessage: AgentSessionMessage = {
      id: userMessageId,
      role: "user",
      content,
      documentId,
      createdAt: new Date().toISOString(),
    }

    dispatch(agentSessionsActions.startStreaming({ userMessage, assistantMessageId }))

    try {
      await streamChatResponse({
        organizationId,
        projectId,
        agentId,
        sessionId: agentSessionId,
        content,
        documentId,
        handlers: {
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
      })
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
  },
)
