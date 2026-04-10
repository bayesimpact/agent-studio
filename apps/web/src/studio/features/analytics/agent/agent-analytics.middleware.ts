import { createListenerMiddleware } from "@reduxjs/toolkit"
import { hasAgentChanged } from "@/common/features/agents/agents.selectors"
import { hasProjectChanged } from "@/common/features/projects/projects.selectors"
import type { AppDispatch, RootState } from "@/common/store/types"
import { agentAnalyticsActions } from "./agent-analytics.slice"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

function registerListeners() {
  listenerMiddleware.startListening({
    predicate(_, currentState, originalState) {
      return (
        hasProjectChanged(originalState, currentState) ||
        hasAgentChanged(originalState, currentState)
      )
    },
    effect: (_, listenerApi) => {
      listenerApi.dispatch(agentAnalyticsActions.reset())
    },
  })
}

export const agentAnalyticsMiddleware = {
  listenerMiddleware,
  registerListeners,
}
