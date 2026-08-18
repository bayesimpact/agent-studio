import { ToolName } from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { selectPlaygroundRevision } from "@/common/features/agents/agent-settings/agent-settings.selectors"
import { getCurrentId } from "@/common/features/helpers"
import type { RootState, ThunkExtraArg } from "@/common/store"
import { generateId } from "@/common/utils/generate-id"
import type { ConversationAgentSession } from "../../conversation/conversation-agent-sessions.models"
import { conversationAgentSessionsActions } from "../../conversation/conversation-agent-sessions.slice"
import { buildType } from "../base-agent-session/base-agent-sessions.thunks"
import type { AgentSessionMessage } from "./agent-session-messages.models"
import { agentSessionMessagesActions } from "./agent-session-messages.slice"
import { streamChatResponse } from "./external/agent-session-messages-streaming"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listMessages = createAsyncThunk<AgentSessionMessage[], string, ThunkConfig>(
  "agentSessionMessages/listMessages",
  async (agentSessionId, { extra: { services }, getState }) => {
    const state = getState()
    const organizationId = getCurrentId({ state, name: "organizationId" })
    const projectId = getCurrentId({ state, name: "projectId" })
    const agentId = getCurrentId({ state, name: "agentId" })
    const params = { organizationId, projectId, agentId }
    return services.agentSessionMessages.getAll({
      ...params,
      agentSessionId,
      payload: { type: buildType() },
    })
  },
)

export const getMessage = createAsyncThunk<AgentSessionMessage, string, ThunkConfig>(
  "agentSessionMessages/getMessage",
  async (messageId, { extra: { services }, getState }) => {
    const state = getState()
    const organizationId = getCurrentId({ state, name: "organizationId" })
    const projectId = getCurrentId({ state, name: "projectId" })
    const agentId = getCurrentId({ state, name: "agentId" })
    const agentSessionId = getCurrentId({ state, name: "agentSessionId" })
    const params = { organizationId, projectId, agentId, agentSessionId }
    return services.agentSessionMessages.getOne({
      ...params,
      messageId,
      payload: { type: buildType() },
    })
  },
)

export const getAttachmentDocumentTemporaryUrl = createAsyncThunk<
  { url: string },
  { attachmentDocumentId: string },
  ThunkConfig
>(
  "agentSessionMessages/getAttachmentDocumentTemporaryUrl",
  async ({ attachmentDocumentId }, { extra: { services }, getState }) => {
    const state = getState()
    const organizationId = getCurrentId({ state, name: "organizationId" })
    const projectId = getCurrentId({ state, name: "projectId" })
    const agentId = getCurrentId({ state, name: "agentId" })
    const agentSessionId = getCurrentId({ state, name: "agentSessionId" })
    const params = { organizationId, projectId, agentId, agentSessionId }
    return services.agentSessionMessages.getAttachmentDocumentTemporaryUrl({
      ...params,
      attachmentDocumentId,
      payload: { type: buildType() },
    })
  },
)

export const sendMessage = createAsyncThunk<
  void,
  {
    content: string
    agentSession: ConversationAgentSession
    file?: File
    onFillFormToolEvent?: () => void
  },
  ThunkConfig
>(
  "agentSessionMessages/sendMessage",
  async (
    { content, agentSession, file, onFillFormToolEvent },
    { extra: { services }, dispatch, getState, signal },
  ) => {
    const state = getState()
    const organizationId = getCurrentId({ state, name: "organizationId" })
    const projectId = getCurrentId({ state, name: "projectId" })
    const agentId = getCurrentId({ state, name: "agentId" })

    if (agentSession.agentId !== agentId) {
      throw new Error("Agent session does not belong to the current agent")
    }

    const agentSessionId = agentSession.id

    // Only the playground may name a version; the API rejects one on a live session.
    const agentSettingsRevision =
      agentSession.type === "playground"
        ? selectPlaygroundRevision({ agentId, agentSessionId })(state)
        : undefined

    // Only the playground may name a version; the API rejects one on a live session. `buildType`
    // is the same signal the session was created with, so the two can never disagree.
    const agentSettingsRevision =
      buildType() === "playground"
        ? selectPlaygroundRevision({ agentId, agentSessionId })(state)
        : undefined

    // Guard: don't allow sending if already streaming
    if (state.agentSessionMessages.isStreaming) {
      return
    }

    const userMessageId = generateId()
    const assistantMessageId = generateId()

    let attachmentDocumentId: string | undefined

    if (file) {
      const attachmentDocument = await services.agentSessionMessages.uploadAttachmentDocument({
        organizationId,
        projectId,
        agentId,
        agentSessionId,
        file,
        payload: { type: buildType() },
      })
      attachmentDocumentId = attachmentDocument.attachmentDocumentId
    }

    const userMessage: AgentSessionMessage = {
      id: userMessageId,
      role: "user",
      content,
      attachmentDocumentId,
      createdAt: Date.now(),
    }

    dispatch(
      agentSessionMessagesActions.startStreaming({
        userMessage,
        assistantMessageId,
        agentRevision: agentSettingsRevision,
      }),
    )

    // The message the answer is being written into: the optimistic one until the stream names the
    // persisted one. Errors and truncations are attributed to whichever is current.
    let streamedMessageId = assistantMessageId
    // A stream that ends with neither `end` nor `error` left the message half-written. Without
    // this the bubble would stay in `streaming` for good and block every later send.
    let sawTerminalEvent = false

    try {
      await streamChatResponse({
        organizationId,
        projectId,
        agentId,
        agentSessionId,
        content,
        attachmentDocumentId,
        agentSettingsRevision,
        assistantMessageId,
        handlers: {
          onStart: (event) => {
            streamedMessageId = event.messageId
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
          onNotifyClient(event) {
            // Record the running tool so the UI can show a live status timeline.
            dispatch(agentSessionMessagesActions.addStreamingToolStep({ toolName: event.toolName }))

            switch (event.toolName) {
              case ToolName.FillForm:
                if (onFillFormToolEvent) onFillFormToolEvent()
                // FIXME: should be replace by getOne
                else dispatch(conversationAgentSessionsActions.getAll({ agentId }))

                break

              default:
                break
            }
          },
          onEnd: async (event) => {
            sawTerminalEvent = true
            dispatch(
              agentSessionMessagesActions.completeAssistantMessage({
                messageId: event.messageId,
                fullContent: event.fullContent,
              }),
            )
            dispatch(getMessage(event.messageId))
          },
          onError: (event) => {
            sawTerminalEvent = true
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

      if (!sawTerminalEvent) {
        dispatch(
          agentSessionMessagesActions.failAssistantMessage({
            messageId: streamedMessageId,
            error: "The response ended unexpectedly",
          }),
        )
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to stream response"
      dispatch(
        agentSessionMessagesActions.failAssistantMessage({
          messageId: streamedMessageId,
          error: errorMessage,
        }),
      )
      throw error
    }
  },
)
