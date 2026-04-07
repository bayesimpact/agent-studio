import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { notificationsActions } from "@/features/notifications/notifications.slice"
import { hasProjectChanged } from "@/features/projects/projects.selectors"
import type { AppDispatch, RootState } from "@/store/types"
import {
  inviteProjectMembers,
  listProjectMemberships,
  removeProjectMembership,
} from "./project-memberships.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

function registerListeners() {
  // Refresh project memberships when current project changes
  listenerMiddleware.startListening({
    predicate(_, currentState, originalState) {
      return hasProjectChanged(originalState, currentState)
    },
    effect: async (_, listenerApi) => {
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
}

export const projectMembershipsMiddleware = { listenerMiddleware, registerListeners }
