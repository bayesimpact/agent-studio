import { createListenerMiddleware } from "@reduxjs/toolkit"
import { hasProjectChanged } from "@/common/features/projects/projects.selectors"
import type { AppDispatch, RootState } from "@/common/store/types"
import { projectAnalyticsActions } from "./analytics.slice"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

function registerListeners() {
  listenerMiddleware.startListening({
    predicate(_, currentState, originalState) {
      return hasProjectChanged(originalState, currentState)
    },
    effect: (_, listenerApi) => {
      listenerApi.dispatch(projectAnalyticsActions.reset())
    },
  })
}

export const projectAnalyticsMiddleware = {
  listenerMiddleware,
  registerListeners,
}
