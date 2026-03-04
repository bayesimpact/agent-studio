import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { generateId } from "@/utils/generate-id"
import { selectIsAdminInterface } from "../../auth/auth.selectors"
import { getCurrentIds } from "../../helpers"
import { streamChatResponse } from "../base-agent-session/external/base-agent-session-streaming"
import type { FormAgentSession, FormAgentSessionMessage } from "./form-agent-sessions.models"
import { formAgentSessionsActions } from "./form-agent-sessions.slice"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listFormAgentSessions = createAsyncThunk<
  FormAgentSession[],
  { agentId: string },
  ThunkConfig
>(
  "formAgentSession/listFormAgentSessions",
  async ({ agentId }, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    const isAdminInterface = selectIsAdminInterface(state)
    return services.formAgentSessions.getAll({
      organizationId,
      projectId,
      agentId,
      type: isAdminInterface ? "playground" : "live",
    })
  },
)

export const createFormAgentSession = createAsyncThunk<
  FormAgentSession,
  { agentId: string; onSuccess?: (agentSessionId: string) => void },
  ThunkConfig
>(
  "formAgentSession/createFormAgentSession",
  async ({ agentId }, { extra: { services }, getState }) => {
    const state = getState()
    const isAdminInterface = selectIsAdminInterface(state)
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return services.formAgentSessions.createOne({
      organizationId,
      projectId,
      agentId,
      type: isAdminInterface ? "playground" : "live",
    })
  },
)

export const loadSessionMessages = createAsyncThunk<FormAgentSessionMessage[], string, ThunkConfig>(
  "formAgentSession/loadSessionMessages",
  async (agentSessionId, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId, agentId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId", "agentId"],
    })
    const isAdminInterface = selectIsAdminInterface(state)
    return services.formAgentSessions.getMessages({
      organizationId,
      projectId,
      agentId,
      agentSessionId,
      type: isAdminInterface ? "playground" : "live",
    })
  },
)

export const sendMessage = createAsyncThunk<void, { content: string; file?: File }, ThunkConfig>(
  "formAgentSession/sendMessage",
  async ({ content, file }, { extra: { services }, dispatch, getState, signal }) => {
    const state = getState()
    const { organizationId, projectId, agentId, agentSessionId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId", "agentId", "agentSessionId"],
    })

    const agentSessionsState = state.formAgentSessions

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

    const userMessage: FormAgentSessionMessage = {
      id: userMessageId,
      role: "user",
      content,
      documentId,
      createdAt: new Date().toISOString(),
    }

    dispatch(formAgentSessionsActions.startStreaming({ userMessage, assistantMessageId }))

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
              formAgentSessionsActions.updateAssistantMessageId({
                oldMessageId: assistantMessageId,
                newMessageId: event.messageId,
              }),
            )
          },
          onChunk: (event) => {
            dispatch(
              formAgentSessionsActions.appendAssistantChunk({
                messageId: event.messageId,
                chunk: event.content,
              }),
            )
          },
          onEnd: (event) => {
            dispatch(
              formAgentSessionsActions.completeAssistantMessage({
                messageId: event.messageId,
                fullContent: event.fullContent,
              }),
            )
          },
          onError: (event) => {
            dispatch(
              formAgentSessionsActions.failAssistantMessage({
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
        formAgentSessionsActions.failAssistantMessage({
          messageId: assistantMessageId,
          error: errorMessage,
        }),
      )
      throw error
    }
  },
)
