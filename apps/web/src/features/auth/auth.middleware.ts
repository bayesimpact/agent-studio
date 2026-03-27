import { createListenerMiddleware } from "@reduxjs/toolkit"
import { consumePendingInvitation } from "@/routes/HomeRoute"
import type { AppDispatch, RootState } from "@/store/types"
import { acceptInvitation } from "../invitations/invitations.thunks"
import { meActions } from "../me/me.slice"
import { fetchMe } from "../me/me.thunks"
import { organizationsActions } from "../organizations/organizations.slice"
import { authActions } from "./auth.slice"

// Create typed listener middleware
const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

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

export { listenerMiddleware as authMiddleware }
