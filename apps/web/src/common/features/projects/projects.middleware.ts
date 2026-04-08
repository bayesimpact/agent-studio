import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/common/store/types"
import { hasOrganizationChanged } from "../organizations/organizations.selectors"
import { listProjects } from "./projects.thunks"

// Create typed listener middleware
const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

// List projects when the current organization changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    return hasOrganizationChanged(originalState, currentState)
  },
  effect: async (_, listenerApi) => {
    await listenerApi.dispatch(listProjects())
  },
})

export { listenerMiddleware as projectsMiddleware }
