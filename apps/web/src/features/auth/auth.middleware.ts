import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { consumePendingInvitation } from "@/routes/HomeRoute"
import { ADS } from "@/store/async-data-status"
import type { AppDispatch, RootState } from "@/store/types"
import { acceptInvitation } from "../invitations/invitations.thunks"
import { selectMe } from "../me/me.selectors"
import { meActions } from "../me/me.slice"
import { fetchMe } from "../me/me.thunks"
import { selectCurrentOrganization } from "../organizations/organizations.selectors"
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
  matcher: isAnyOf(organizationsActions.setCurrentOrganizationId, fetchMe.fulfilled),
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const user = selectMe(state)
    const org = selectCurrentOrganization(state)

    // we don't have enough information to determine if the user is an admin
    if (!ADS.isFulfilled(org) || !user) return

    listenerApi.dispatch(authActions.setIsAdmin(org.value.role))
  },
})

export { listenerMiddleware as authMiddleware }
