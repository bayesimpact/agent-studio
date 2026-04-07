import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/common/store/types"
import { hasProjectChanged } from "@/features/projects/projects.selectors"
import { analyticsActions } from "./analytics.slice"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

function registerListeners() {
  listenerMiddleware.startListening({
    predicate(_, currentState, originalState) {
      return hasProjectChanged(originalState, currentState)
    },
    effect: (_, listenerApi) => {
      listenerApi.dispatch(analyticsActions.reset())
    },
  })
}

export const analyticsMiddleware = {
  listenerMiddleware,
  registerListeners,
}
