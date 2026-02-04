import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { meActions } from "../me/me.slice"
import { fetchMe } from "../me/me.thunks"
import {
  selectCurrentOrganization,
  selectCurrentOrganizationId,
} from "../organizations/organizations.selectors"
import { organizationsActions } from "../organizations/organizations.slice"
import { authActions } from "./auth.slice"

// Create typed listener middleware
const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Listen for authentication state changes and automatically fetch user data
listenerMiddleware.startListening({
  actionCreator: authActions.setAuthenticated,
  effect: async (action, listenerApi) => {
    const isAuthenticated = action.payload

    if (isAuthenticated) {
      // User became authenticated - fetch user data
      await listenerApi.dispatch(fetchMe())
    } else {
      // User logged out - clear user and organizations state
      listenerApi.dispatch(meActions.reset())
      listenerApi.dispatch(organizationsActions.reset())
    }
  },
})

listenerMiddleware.startListening({
  actionCreator: fetchMe.fulfilled,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState()
    const currentOrgId = selectCurrentOrganizationId(state)
    if (currentOrgId) {
      // Current organization is already set - do nothing
      return
    }
    const firstOrg = action.payload.organizations[0]
    if (firstOrg) {
      listenerApi.dispatch(
        organizationsActions.setCurrentOrganizationId({ organizationId: firstOrg.id }),
      )
    }
  },
})

listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevOrgId = selectCurrentOrganizationId(originalState)
    const newOrgId = selectCurrentOrganizationId(currentState)
    return prevOrgId !== newOrgId
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const org = selectCurrentOrganization(state)
    if (!org) return window.console.error("No current organization selected")
    listenerApi.dispatch(authActions.setIsAdmin(org.role === "admin" || org.role === "owner"))
  },
})

export { listenerMiddleware as authMiddleware }
