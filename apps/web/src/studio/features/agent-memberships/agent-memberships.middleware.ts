import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import { hasProjectChanged } from "@/common/features/projects/projects.selectors"
import type { AppDispatch, RootState } from "@/common/store/types"
import { hasAgentChanged } from "@/features/agents/agents.selectors"
import {
  inviteAgentMembers,
  listAgentMemberships,
  removeAgentMembership,
} from "./agent-memberships.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

function registerListeners() {
  // Refresh project memberships when current project changes
  listenerMiddleware.startListening({
    predicate(_, currentState, originalState) {
      return (
        hasProjectChanged(originalState, currentState) ||
        hasAgentChanged(originalState, currentState)
      )
    },
    effect: async (_, listenerApi) => {
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
}

export const agentMembershipsMiddleware = { listenerMiddleware, registerListeners }
