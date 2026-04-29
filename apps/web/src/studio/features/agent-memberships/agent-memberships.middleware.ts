import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { hasAgentChanged } from "@/common/features/agents/agents.selectors"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import type { AppDispatch, RootState } from "@/common/store/types"
import { agentMembershipsActions } from "./agent-memberships.slice"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

function registerListeners() {
  listenerMiddleware.startListening({
    actionCreator: agentMembershipsActions.mount,
    effect: async (_, listenerApi) => {
      await listenerApi.dispatch(agentMembershipsActions.list())
    },
  })
  listenerMiddleware.startListening({
    actionCreator: agentMembershipsActions.unmount,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(agentMembershipsActions.reset())
    },
  })

  // Refresh agent memberships when current agent changes
  listenerMiddleware.startListening({
    predicate(_, currentState, originalState) {
      return hasAgentChanged(originalState, currentState)
    },
    effect: async (_, listenerApi) => {
      await listenerApi.dispatch(agentMembershipsActions.list())
    },
  })

  // Refresh list after invite or remove
  listenerMiddleware.startListening({
    matcher: isAnyOf(
      agentMembershipsActions.invite.fulfilled,
      agentMembershipsActions.remove.fulfilled,
    ),
    effect: async (_, listenerApi) => {
      await listenerApi.dispatch(agentMembershipsActions.list())
    },
  })

  listenerMiddleware.startListening({
    actionCreator: agentMembershipsActions.invite.fulfilled,
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
    actionCreator: agentMembershipsActions.invite.rejected,
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
    actionCreator: agentMembershipsActions.remove.fulfilled,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Member removed successfully",
          type: "success",
        }),
      )
    },
  })
  listenerMiddleware.startListening({
    actionCreator: agentMembershipsActions.remove.rejected,
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
