import { createListenerMiddleware } from "@reduxjs/toolkit"
import { authActions } from "@/common/features/auth/auth.slice"
import { meActions } from "@/common/features/me/me.slice"
import { fetchMe } from "@/common/features/me/me.thunks"
import { organizationsActions } from "@/common/features/organizations/organizations.slice"
import { consumePendingInvitation } from "@/common/routes/HomeRoute"
import type { AppDispatch, RootState } from "@/common/store/types"
import { acceptInvitation } from "@/studio/features/invitations/invitations.thunks"

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
