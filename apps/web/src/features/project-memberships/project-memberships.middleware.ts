import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { hasInterfaceChanged, selectIsAdminInterface } from "../auth/auth.selectors"
import { notificationsActions } from "../notifications/notifications.slice"
import { hasProjectChanged } from "../projects/projects.selectors"
import {
  inviteProjectMembers,
  listProjectMemberships,
  removeProjectMembership,
} from "./project-memberships.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

// Refresh project memberships when current project changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    return (
      hasInterfaceChanged(originalState, currentState) ||
      hasProjectChanged(originalState, currentState)
    )
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    if (!isAdminInterface) return

    await listenerApi.dispatch(listProjectMemberships())
  },
})

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
