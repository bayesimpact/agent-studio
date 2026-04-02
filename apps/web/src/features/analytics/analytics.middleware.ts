import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { hasInterfaceChanged } from "../auth/auth.selectors"
import { hasProjectChanged } from "../projects/projects.selectors"
import { analyticsActions } from "./analytics.slice"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    return (
      hasInterfaceChanged(originalState, currentState) ||
      hasProjectChanged(originalState, currentState)
    )
  },
  effect: (_, listenerApi) => {
    listenerApi.dispatch(analyticsActions.reset())
  },
})

export { listenerMiddleware as analyticsMiddleware }
