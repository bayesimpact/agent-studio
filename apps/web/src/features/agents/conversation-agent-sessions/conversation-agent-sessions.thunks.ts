import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { generateId } from "@/utils/generate-id"
import { selectIsAdminInterface } from "../../auth/auth.selectors"
import { getCurrentIds } from "../../helpers"
import type {
  ConversationAgentSession,
  ConversationAgentSessionMessage,
} from "./conversation-agent-sessions.models"
import { conversationAgentSessionsActions } from "./conversation-agent-sessions.slice"
import { streamChatResponse } from "./external/conversation-agent-session-streaming"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listConversationAgentSessions = createAsyncThunk<
  ConversationAgentSession[],
  { agentId: string },
  ThunkConfig
>(
  "conversationAgentSession/listConversationAgentSessions",
  async ({ agentId }, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    const isAdminInterface = selectIsAdminInterface(state)
    return services.conversationAgentSessions.getAll({
      organizationId,
      projectId,
      agentId,
      type: isAdminInterface ? "playground" : "live",
    })
  },
)

export const createConversationAgentSession = createAsyncThunk<
  ConversationAgentSession,
  { agentId: string; onSuccess?: (agentSessionId: string) => void },
  ThunkConfig
>(
  "conversationAgentSession/createConversationAgentSession",
  async ({ agentId }, { extra: { services }, getState }) => {
    const state = getState()
    const isAdminInterface = selectIsAdminInterface(state)
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return services.conversationAgentSessions.createOne({
      organizationId,
      projectId,
      agentId,
      type: isAdminInterface ? "playground" : "live",
    })
  },
)

export const loadSessionMessages = createAsyncThunk<
  ConversationAgentSessionMessage[],
  string,
  ThunkConfig
>(
  "conversationAgentSession/loadSessionMessages",
  async (agentSessionId, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId, agentId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId", "agentId"],
    })
    const isAdminInterface = selectIsAdminInterface(state)
    return services.conversationAgentSessions.getMessages({
      organizationId,
      projectId,
      agentId,
      agentSessionId,
      type: isAdminInterface ? "playground" : "live",
    })
  },
)

export const sendMessage = createAsyncThunk<void, { content: string; file?: File }, ThunkConfig>(
  "conversationAgentSession/sendMessage",
  async ({ content, file }, { extra: { services }, dispatch, getState, signal }) => {
    const state = getState()
    const { organizationId, projectId, agentId, agentSessionId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId", "agentId", "agentSessionId"],
    })

    const agentSessionsState = state.conversationAgentSessions

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

    const userMessage: ConversationAgentSessionMessage = {
      id: userMessageId,
      role: "user",
      content,
      documentId,
      createdAt: new Date().toISOString(),
    }

    dispatch(conversationAgentSessionsActions.startStreaming({ userMessage, assistantMessageId }))

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
              conversationAgentSessionsActions.updateAssistantMessageId({
                oldMessageId: assistantMessageId,
                newMessageId: event.messageId,
              }),
            )
          },
          onChunk: (event) => {
            dispatch(
              conversationAgentSessionsActions.appendAssistantChunk({
                messageId: event.messageId,
                chunk: event.content,
              }),
            )
          },
          onEnd: (event) => {
            dispatch(
              conversationAgentSessionsActions.completeAssistantMessage({
                messageId: event.messageId,
                fullContent: event.fullContent,
              }),
            )
          },
          onError: (event) => {
            dispatch(
              conversationAgentSessionsActions.failAssistantMessage({
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
        conversationAgentSessionsActions.failAssistantMessage({
          messageId: assistantMessageId,
          error: errorMessage,
        }),
      )
      throw error
    }
  },
)
