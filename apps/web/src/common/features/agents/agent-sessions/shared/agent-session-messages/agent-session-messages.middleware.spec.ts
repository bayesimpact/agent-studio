import { combineReducers, configureStore, type Reducer } from "@reduxjs/toolkit"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { RootState } from "@/common/store/types"
import type { Services } from "@/di/services"
import { conversationAgentSessionsActions } from "../../conversation/conversation-agent-sessions.slice"
import {
  agentSessionMessagesMiddleware,
  STREAMING_RECOVERY_MAX_CONSECUTIVE_FAILURES,
  STREAMING_RECOVERY_POLL_INTERVAL_MS,
} from "./agent-session-messages.middleware"
import type { AgentSessionMessage } from "./agent-session-messages.models"
import {
  agentSessionMessagesActions,
  agentSessionMessagesSlice,
} from "./agent-session-messages.slice"
import { listMessages } from "./agent-session-messages.thunks"

// The thunks module reaches the Auth0 client and `window.location` transitively; neither exists
// under vitest's node environment.
vi.mock("@/studio/routes/helpers", () => ({ isStudioInterface: vi.fn() }))
vi.mock("./external/agent-session-messages-streaming", () => ({ streamChatResponse: vi.fn() }))

const agentSessionId = "session-1"
const currentIds = {
  organizationId: "org-1",
  projectId: "project-1",
  agentId: "agent-1",
  agentSessionId,
}

const userMessage: AgentSessionMessage = { id: "user-1", role: "user", content: "Hello" }
const streamingReply: AgentSessionMessage = {
  id: "assistant-1",
  role: "assistant",
  content: "",
  status: "streaming",
}
const completedReply: AgentSessionMessage = {
  ...streamingReply,
  content: "Hi!",
  status: "completed",
}

/**
 * A store holding only the slices the listener reads. The messages slice reducer is the real one
 * so the loop observes the same state transitions production does. The cast mirrors the one in
 * the production store: `RootState` is the many-scope union the listener is typed against.
 */
function buildStore(getOne: ReturnType<typeof vi.fn>) {
  const services = { agentSessionMessages: { getOne } } as unknown as Services
  const store = configureStore({
    reducer: combineReducers({
      agentSessionMessages: agentSessionMessagesSlice.reducer,
      currentIds: (state = currentIds) => state,
    }) as unknown as Reducer<RootState>,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: { services } } }).prepend(
        agentSessionMessagesMiddleware.listenerMiddleware.middleware,
      ),
  })
  agentSessionMessagesMiddleware.registerListeners()
  return store
}

const loaded = (messages: AgentSessionMessage[]) =>
  listMessages.fulfilled(messages, "request-1", agentSessionId)

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  agentSessionMessagesMiddleware.listenerMiddleware.clearListeners()
  vi.useRealTimers()
})

describe("streaming recovery polling", () => {
  it("re-fetches a reply still streaming after load until it settles", async () => {
    // A refresh mid-reply loses the SSE stream, but the server keeps writing the message. The
    // page has to find out how it ended instead of spinning forever.
    const getOne = vi
      .fn()
      .mockResolvedValueOnce(streamingReply)
      .mockResolvedValueOnce(completedReply)
    const store = buildStore(getOne)

    store.dispatch(loaded([userMessage, streamingReply]))

    await vi.advanceTimersByTimeAsync(STREAMING_RECOVERY_POLL_INTERVAL_MS)
    expect(getOne).toHaveBeenCalledTimes(1)
    expect(getOne).toHaveBeenCalledWith(expect.objectContaining({ messageId: streamingReply.id }))

    await vi.advanceTimersByTimeAsync(STREAMING_RECOVERY_POLL_INTERVAL_MS)
    expect(getOne).toHaveBeenCalledTimes(2)
    expect(store.getState().agentSessionMessages.isStreaming).toBe(false)

    // Settled: no further poll.
    await vi.advanceTimersByTimeAsync(STREAMING_RECOVERY_POLL_INTERVAL_MS * 3)
    expect(getOne).toHaveBeenCalledTimes(2)
  })

  it("polls only the reply it started for, leaving a later live send alone", async () => {
    // Once the recovered reply settles the composer unlocks, and the user typically resends at
    // once. That new turn is streamed live over SSE under an optimistic id the server does not
    // know yet: polling it would 404 and kill the live reply.
    const getOne = vi.fn().mockResolvedValue(completedReply)
    const store = buildStore(getOne)

    store.dispatch(loaded([userMessage, streamingReply]))
    await vi.advanceTimersByTimeAsync(STREAMING_RECOVERY_POLL_INTERVAL_MS)
    expect(getOne).toHaveBeenCalledTimes(1)

    store.dispatch(
      agentSessionMessagesActions.startStreaming({
        userMessage: { id: "user-2", role: "user", content: "Again" },
        assistantMessageId: "optimistic-2",
      }),
    )
    await vi.advanceTimersByTimeAsync(STREAMING_RECOVERY_POLL_INTERVAL_MS * 3)

    expect(getOne).toHaveBeenCalledTimes(1)
    expect(store.getState().agentSessionMessages.data.value?.[3]).toMatchObject({
      id: "optimistic-2",
      status: "streaming",
    })
  })

  it("does not poll when every loaded reply has settled", async () => {
    const getOne = vi.fn()
    const store = buildStore(getOne)

    store.dispatch(loaded([userMessage, completedReply]))
    await vi.advanceTimersByTimeAsync(STREAMING_RECOVERY_POLL_INTERVAL_MS * 3)

    expect(getOne).not.toHaveBeenCalled()
  })

  it("stops polling when the session is left", async () => {
    const getOne = vi.fn().mockResolvedValue(streamingReply)
    const store = buildStore(getOne)

    store.dispatch(loaded([userMessage, streamingReply]))
    await vi.advanceTimersByTimeAsync(STREAMING_RECOVERY_POLL_INTERVAL_MS)
    expect(getOne).toHaveBeenCalledTimes(1)

    store.dispatch(conversationAgentSessionsActions.sessionUnmount())
    await vi.advanceTimersByTimeAsync(STREAMING_RECOVERY_POLL_INTERVAL_MS * 3)

    expect(getOne).toHaveBeenCalledTimes(1)
  })

  it("keeps polling through a transient failure", async () => {
    // The server is still writing the reply; a network blip or a token refresh on one poll must
    // not turn it into a failed reply the user then resends, producing a duplicate turn.
    const getOne = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce(completedReply)
    const store = buildStore(getOne)

    store.dispatch(loaded([userMessage, streamingReply]))
    await vi.advanceTimersByTimeAsync(STREAMING_RECOVERY_POLL_INTERVAL_MS * 2)

    expect(getOne).toHaveBeenCalledTimes(2)
    expect(store.getState().agentSessionMessages.data.value?.[1]).toEqual(completedReply)
  })

  it("marks the reply as failed once polls keep failing", async () => {
    // Without this the spinner would outlive a deleted or unreachable message.
    const getOne = vi.fn().mockRejectedValue(new Error("Message not found"))
    const store = buildStore(getOne)

    store.dispatch(loaded([userMessage, streamingReply]))
    await vi.advanceTimersByTimeAsync(
      STREAMING_RECOVERY_POLL_INTERVAL_MS * (STREAMING_RECOVERY_MAX_CONSECUTIVE_FAILURES - 1),
    )
    expect(store.getState().agentSessionMessages.data.value?.[1]).toMatchObject({
      status: "streaming",
    })

    await vi.advanceTimersByTimeAsync(STREAMING_RECOVERY_POLL_INTERVAL_MS)
    const state = store.getState().agentSessionMessages
    expect(state.isStreaming).toBe(false)
    expect(state.data.value?.[1]).toMatchObject({ id: streamingReply.id, status: "error" })

    await vi.advanceTimersByTimeAsync(STREAMING_RECOVERY_POLL_INTERVAL_MS * 3)
    expect(getOne).toHaveBeenCalledTimes(STREAMING_RECOVERY_MAX_CONSECUTIVE_FAILURES)
  })
})
