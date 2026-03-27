import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { hasAgentChanged } from "../agents/agents.selectors"
import { hasInterfaceChanged, selectIsAdminInterface } from "../auth/auth.selectors"
import { notificationsActions } from "../notifications/notifications.slice"
import { hasProjectChanged } from "../projects/projects.selectors"
import {
  inviteAgentMembers,
  listAgentMemberships,
  removeAgentMembership,
} from "./agent-memberships.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh project memberships when current project changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    return (
      hasInterfaceChanged(originalState, currentState) ||
      hasProjectChanged(originalState, currentState) ||
      hasAgentChanged(originalState, currentState)
    )
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    if (!isAdminInterface) return

    await listenerApi.dispatch(listAgentMemberships())
  },
})

// Refresh list after invite or remove
listenerMiddleware.startListening({
  matcher: isAnyOf(inviteAgentMembers.fulfilled, removeAgentMembership.fulfilled),
  effect: async (_, listenerApi) => {
    await listenerApi.dispatch(listAgentMemberships())
  },
})

// Success notifications
listenerMiddleware.startListening({
  actionCreator: inviteAgentMembers.fulfilled,
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
  actionCreator: removeAgentMembership.fulfilled,
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
  actionCreator: inviteAgentMembers.rejected,
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
  actionCreator: removeAgentMembership.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Failed to remove member",
        type: "error",
      }),
    )
  },
})

export { listenerMiddleware as agentMembershipsMiddleware }
