import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import { consumePendingInvitation } from "@/routes/HomeRoute"
import type { AppDispatch, RootState } from "@/store/types"
import { acceptInvitation } from "../invitations/invitations.thunks"
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
      // Check for a pending invitation BEFORE fetching /me.
      // This is critical: /me triggers UserGuard.findOrCreate which would create
      // a duplicate user. acceptInvitation reconciles the placeholder user's
      // auth0Id first, so /me then finds the correct existing user.
      const pendingTicketId = consumePendingInvitation()
      if (pendingTicketId) {
        await listenerApi.dispatch(acceptInvitation({ ticketId: pendingTicketId }))
      }

      // Now fetch user data (will find the reconciled user, not create a new one)
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

// Set isAdmin and isAdminInterface flags when current organization changes
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

    const isAdmin = org.role === "admin" || org.role === "owner"
    listenerApi.dispatch(authActions.setIsAdmin(isAdmin))

    const isAdminInterface = isAdmin && window.location.pathname.startsWith("/admin/")
    listenerApi.dispatch(authActions.setIsAdminInterface(isAdminInterface))
  },
})

export { listenerMiddleware as authMiddleware }
