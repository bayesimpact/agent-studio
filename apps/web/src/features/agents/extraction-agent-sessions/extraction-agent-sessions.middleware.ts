import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import type { AppDispatch, RootState } from "@/common/store"
import { getCurrentIds } from "../../helpers"
import type { Agent } from "../agents.models"
import { loadAgentSessionsForAllAgents } from "../shared/base-agent-session/base-agent-sessions.thunks"
import { executeExtractionAgentSession } from "./extraction-agent-sessions.thunks"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

// Refresh extraction agent sessions when create a new run
listenerMiddleware.startListening({
  matcher: isAnyOf(executeExtractionAgentSession.fulfilled, executeExtractionAgentSession.rejected),
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const { agentId } = getCurrentIds({ state, wantedIds: ["agentId"] })
    await loadAgentSessionsForAllAgents({
      agentType: "extraction",
      agents: [{ id: agentId, type: "extraction" } as Agent],
      listenerApi,
    })
  },
})
listenerMiddleware.startListening({
  actionCreator: executeExtractionAgentSession.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Extraction executed successfully",
        type: "success",
      }),
    )
  },
})
listenerMiddleware.startListening({
  actionCreator: executeExtractionAgentSession.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Extraction execution failed",
        type: "error",
      }),
    )
  },
})

export { listenerMiddleware as extractionAgentSessionsMiddleware }
