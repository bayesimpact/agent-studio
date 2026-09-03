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

const findStreamingReply = (messages: AgentSessionMessage[]): AgentSessionMessage | undefined =>
  messages.find((message) => message.role === "assistant" && message.status === "streaming")

function registerListeners() {
  // A page refresh while the agent writes closes the SSE stream, but the server keeps writing and
  // persists the outcome. Loading such a reply used to render a spinner nothing would ever
  // resolve; instead re-fetch it until the server reports it settled.
  listenerMiddleware.startListening({
    actionCreator: listMessages.fulfilled,
    effect: async (action, listenerApi) => {
      if (!findStreamingReply(action.payload)) return

      // One loop per thread, even if the list is reloaded while a loop already runs.
      listenerApi.cancelActiveListeners()

      while (true) {
        await listenerApi.delay(STREAMING_RECOVERY_POLL_INTERVAL_MS)

        // Leaving the session resets the slice, which is how the loop learns to stop.
        const { data } = listenerApi.getState().agentSessionMessages
        if (!ADS.isFulfilled(data)) return
        const streamingReply = findStreamingReply(data.value)
        if (!streamingReply) return

        const result = await listenerApi.dispatch(getMessage(streamingReply.id))
        if (getMessage.rejected.match(result)) {
          listenerApi.dispatch(
            agentSessionMessagesActions.failAssistantMessage({
              messageId: streamingReply.id,
              error: result.error.message ?? "The reply could not be loaded",
            }),
          )
          return
        }
      }
    },
  })
}

export const agentSessionMessagesMiddleware = { listenerMiddleware, registerListeners }
