import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import type { AppDispatch, RootState } from "@/common/store/types"
import {
  deleteDocumentTag,
  updateDocumentTag,
} from "@/studio/features/document-tags/document-tags.thunks"
import { hasProjectChanged } from "../projects/projects.selectors"
import { createAgent, deleteAgent, listAgents, updateAgent } from "./agents.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

// Refresh Agents when current project changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    return hasProjectChanged(originalState, currentState)
  },
  effect: async (_, listenerApi) => {
    await listenerApi.dispatch(listAgents())
  },
})

// Refresh Agents when one is created, updated or deleted
listenerMiddleware.startListening({
  matcher: isAnyOf(
    deleteAgent.fulfilled,
    createAgent.fulfilled,
    updateAgent.fulfilled,
    // DocumentTag changes
    updateDocumentTag.fulfilled,
    deleteDocumentTag.fulfilled,
  ),
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(listAgents())
  },
})

listenerMiddleware.startListening({
  actionCreator: deleteAgent.fulfilled,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Agent deleted successfully",
        type: "success",
      }),
    )

    const onSuccess = action.meta.arg.onSuccess
    const id = action.meta.arg.agentId
    onSuccess?.(id)
  },
})
listenerMiddleware.startListening({
  actionCreator: deleteAgent.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Agent deletion failed",
        type: "error",
      }),
    )
  },
})

listenerMiddleware.startListening({
  actionCreator: createAgent.fulfilled,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Agent created successfully",
        type: "success",
      }),
    )

    const onSuccess = action.meta.arg.onSuccess
    onSuccess?.(action.payload)
  },
})
listenerMiddleware.startListening({
  actionCreator: createAgent.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Agent creation failed",
        type: "error",
      }),
    )
  },
})

listenerMiddleware.startListening({
  actionCreator: updateAgent.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Agent updated successfully",
        type: "success",
      }),
    )
  },
})
listenerMiddleware.startListening({
  actionCreator: updateAgent.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Agent update failed",
        type: "error",
      }),
    )
  },
})

export { listenerMiddleware as agentsMiddleware }
