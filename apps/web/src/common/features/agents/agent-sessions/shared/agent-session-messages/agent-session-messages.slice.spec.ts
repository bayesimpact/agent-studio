import { describe, expect, it, vi } from "vitest"
import { ADS } from "@/common/store/async-data-status"
import type { AgentSessionMessage } from "./agent-session-messages.models"
import {
  agentSessionMessagesInitialState,
  agentSessionMessagesSlice,
} from "./agent-session-messages.slice"
import { getMessage, listMessages } from "./agent-session-messages.thunks"

// The thunks module reaches the Auth0 client and `window.location` transitively; neither exists
// under vitest's node environment, and the reducer under test needs only the action creators.
vi.mock("@/studio/routes/helpers", () => ({ isStudioInterface: vi.fn() }))
vi.mock("./external/agent-session-messages-streaming", () => ({ streamChatResponse: vi.fn() }))

const reducer = agentSessionMessagesSlice.reducer

const userMessage: AgentSessionMessage = { id: "user-1", role: "user", content: "Hello" }
const streamingReply: AgentSessionMessage = {
  id: "assistant-1",
  role: "assistant",
  content: "",
  status: "streaming",
}
const completedReply: AgentSessionMessage = {
  id: "assistant-1",
  role: "assistant",
  content: "Hi!",
  status: "completed",
}

describe("agentSessionMessages slice", () => {
  describe("listMessages.fulfilled", () => {
    it("treats a reply that is still streaming server-side as streaming", () => {
      // After a page refresh the persisted reply can still be "streaming": the server keeps
      // writing it. The composer must stay locked exactly as it was before the refresh.
      const state = reducer(
        agentSessionMessagesInitialState,
        listMessages.fulfilled([userMessage, streamingReply], "request-1", "session-1"),
      )

      expect(state.isStreaming).toBe(true)
    })

    it("does not stream when every reply has settled", () => {
      const state = reducer(
        agentSessionMessagesInitialState,
        listMessages.fulfilled([userMessage, completedReply], "request-1", "session-1"),
      )

      expect(state.isStreaming).toBe(false)
    })
  })

  describe("getMessage.fulfilled", () => {
    it("stops streaming once the polled reply has settled", () => {
      const streamingState = reducer(
        agentSessionMessagesInitialState,
        listMessages.fulfilled([userMessage, streamingReply], "request-1", "session-1"),
      )

      const state = reducer(
        streamingState,
        getMessage.fulfilled(completedReply, "request-2", completedReply.id),
      )

      expect(state.isStreaming).toBe(false)
      expect(ADS.isFulfilled(state.data) && state.data.value[1]).toEqual(completedReply)
    })

    it("keeps streaming while the polled reply is still being written", () => {
      const streamingState = reducer(
        agentSessionMessagesInitialState,
        listMessages.fulfilled([userMessage, streamingReply], "request-1", "session-1"),
      )

      const state = reducer(
        streamingState,
        getMessage.fulfilled(streamingReply, "request-2", streamingReply.id),
      )

      expect(state.isStreaming).toBe(true)
    })
  })
})
