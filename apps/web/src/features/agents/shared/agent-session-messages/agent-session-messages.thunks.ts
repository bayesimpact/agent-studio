import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { generateId } from "@/utils/generate-id"
import { selectIsAdminInterface } from "../../../auth/auth.selectors"
import { getCurrentIds } from "../../../helpers"
import type { AgentSessionMessage } from "./agent-session-messages.models"
import { agentSessionMessagesActions } from "./agent-session-messages.slice"
import { streamChatResponse } from "./external/agent-session-messages-streaming"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listMessages = createAsyncThunk<AgentSessionMessage[], string, ThunkConfig>(
  "agentSessionMessages/listMessages",
  async (agentSessionId, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId, agentId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId", "agentId"],
    })
    const isAdminInterface = selectIsAdminInterface(state)
    return services.agentSessionMessages.getAll({
      organizationId,
      projectId,
      agentId,
      agentSessionId,
      type: isAdminInterface ? "playground" : "live",
    })
  },
)

export const sendMessage = createAsyncThunk<void, { content: string; file?: File }, ThunkConfig>(
  "agentSessionMessages/sendMessage",
  async ({ content, file }, { extra: { services }, dispatch, getState, signal }) => {
    const state = getState()
    const { organizationId, projectId, agentId, agentSessionId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId", "agentId", "agentSessionId"],
    })

    // Guard: don't allow sending if already streaming
    if (state.agentSessionMessages.isStreaming) {
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

    dispatch(agentSessionMessagesActions.startStreaming({ userMessage, assistantMessageId }))

    try {
      await streamChatResponse({
        organizationId,
        projectId,
        agentId,
        agentSessionId,
        content,
        documentId,
        handlers: {
          onStart: (event) => {
            // Update the optimistic message ID to match the backend's ID
            dispatch(
              agentSessionMessagesActions.updateAssistantMessageId({
                oldMessageId: assistantMessageId,
                newMessageId: event.messageId,
              }),
            )
          },
          onChunk: (event) => {
            dispatch(
              agentSessionMessagesActions.appendAssistantChunk({
                messageId: event.messageId,
                chunk: event.content,
              }),
            )
          },
          onEnd: (event) => {
            dispatch(
              agentSessionMessagesActions.completeAssistantMessage({
                messageId: event.messageId,
                fullContent: event.fullContent,
              }),
            )
          },
          onError: (event) => {
            dispatch(
              agentSessionMessagesActions.failAssistantMessage({
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
        agentSessionMessagesActions.failAssistantMessage({
          messageId: assistantMessageId,
          error: errorMessage,
        }),
      )
      throw error
    }
  },
)
