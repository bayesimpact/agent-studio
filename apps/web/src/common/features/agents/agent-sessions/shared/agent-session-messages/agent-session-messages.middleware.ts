import { createListenerMiddleware } from "@reduxjs/toolkit"
import { ADS } from "@/common/store/async-data-status"
import type { AppDispatch, RootState } from "@/common/store/types"
import type { AgentSessionMessage } from "./agent-session-messages.models"
import { agentSessionMessagesActions } from "./agent-session-messages.slice"
import { getMessage, listMessages } from "./agent-session-messages.thunks"

export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

/**
 * How often a reply loaded mid-stream is re-fetched. The server settles the message on its own
 * when the answer completes, fails, or is found orphaned, so the loop only has to notice.
 */
export const STREAMING_RECOVERY_POLL_INTERVAL_MS = 2_000

/**
 * Polls that may fail in a row before the reply is given up on. A single failed read (network
 * blip, token refresh) says nothing about the reply, which the server is still writing.
 */
export const STREAMING_RECOVERY_MAX_CONSECUTIVE_FAILURES = 3

const findStreamingReply = (messages: AgentSessionMessage[]): AgentSessionMessage | undefined =>
  messages.find((message) => message.role === "assistant" && message.status === "streaming")

function registerListeners() {
  // A page refresh while the agent writes closes the SSE stream, but the server keeps writing and
  // persists the outcome. Loading such a reply used to render a spinner nothing would ever
  // resolve; instead re-fetch it until the server reports it settled.
  listenerMiddleware.startListening({
    actionCreator: listMessages.fulfilled,
    effect: async (action, listenerApi) => {
      const streamingReply = findStreamingReply(action.payload)
      if (!streamingReply) return

      // One loop per thread, even if the list is reloaded while a loop already runs.
      listenerApi.cancelActiveListeners()

      // The loop follows this one persisted reply only. A turn the user sends after it settles
      // is streamed live over SSE under an optimistic id the server does not know: polling it
      // would fail and kill the live reply.
      const messageId = streamingReply.id
      let consecutiveFailures = 0

      while (true) {
        await listenerApi.delay(STREAMING_RECOVERY_POLL_INTERVAL_MS)

        // Leaving the session resets the slice, which is how the loop learns to stop.
        const { data } = listenerApi.getState().agentSessionMessages
        if (!ADS.isFulfilled(data)) return
        const reply = data.value.find((message) => message.id === messageId)
        if (reply?.status !== "streaming") return

        const result = await listenerApi.dispatch(getMessage(messageId))
        if (!getMessage.rejected.match(result)) {
          consecutiveFailures = 0
          continue
        }

        consecutiveFailures += 1
        if (consecutiveFailures < STREAMING_RECOVERY_MAX_CONSECUTIVE_FAILURES) continue

        // The reply cannot be followed any more: better a visible failure than a spinner for good.
        listenerApi.dispatch(
          agentSessionMessagesActions.failAssistantMessage({
            messageId,
            error: result.error.message ?? "The reply could not be loaded",
          }),
        )
        return
      }
    },
  })
}

export const agentSessionMessagesMiddleware = { listenerMiddleware, registerListeners }
