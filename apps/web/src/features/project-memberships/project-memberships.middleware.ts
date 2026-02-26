import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { notificationsActions } from "../notifications/notifications.slice"
import {
  inviteProjectMembers,
  listProjectMemberships,
  removeProjectMembership,
} from "./project-memberships.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh list after invite or remove
listenerMiddleware.startListening({
  matcher: isAnyOf(inviteProjectMembers.fulfilled, removeProjectMembership.fulfilled),
  effect: async (_, listenerApi) => {
    await listenerApi.dispatch(listProjectMemberships())
  },
})

// Success notifications
listenerMiddleware.startListening({
  actionCreator: inviteProjectMembers.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Invitations sent successfully",
        type: "success",
      }),
    )
  },
})

listenerMiddleware.startListening({
  actionCreator: removeProjectMembership.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Member removed successfully",
        type: "success",
      }),
    )
  },
})

// Error notifications
listenerMiddleware.startListening({
  actionCreator: inviteProjectMembers.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Failed to send invitations",
        type: "error",
      }),
    )
  },
})

listenerMiddleware.startListening({
  actionCreator: removeProjectMembership.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Failed to remove member",
        type: "error",
      }),
    )
  },
})

export { listenerMiddleware as projectMembershipsMiddleware }
