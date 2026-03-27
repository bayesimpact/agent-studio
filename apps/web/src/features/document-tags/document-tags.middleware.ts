import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { selectIsAdminInterface } from "../auth/auth.selectors"
import { notificationsActions } from "../notifications/notifications.slice"
import { hasProjectChanged } from "../projects/projects.selectors"
import {
  createDocumentTag,
  deleteDocumentTag,
  listDocumentTags,
  updateDocumentTag,
} from "./document-tags.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh DocumentTags when current project changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    return hasProjectChanged(originalState, currentState)
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    if (!isAdminInterface) return
    await listenerApi.dispatch(listDocumentTags())
  },
})

// Refresh DocumentTags when one is created, updated or deleted
listenerMiddleware.startListening({
  matcher: isAnyOf(
    deleteDocumentTag.fulfilled,
    createDocumentTag.fulfilled,
    updateDocumentTag.fulfilled,
  ),
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(listDocumentTags())
  },
})

listenerMiddleware.startListening({
  actionCreator: deleteDocumentTag.fulfilled,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Document tag deleted successfully",
        type: "success",
      }),
    )

    const onSuccess = action.meta.arg.onSuccess
    onSuccess()
  },
})
listenerMiddleware.startListening({
  actionCreator: deleteDocumentTag.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Document tag deletion failed",
        type: "error",
      }),
    )
  },
})

listenerMiddleware.startListening({
  actionCreator: createDocumentTag.fulfilled,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Document tag created successfully",
        type: "success",
      }),
    )

    const onSuccess = action.meta.arg.onSuccess
    onSuccess(action.payload)
  },
})
listenerMiddleware.startListening({
  actionCreator: createDocumentTag.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Document tag creation failed",
        type: "error",
      }),
    )
  },
})

listenerMiddleware.startListening({
  actionCreator: updateDocumentTag.fulfilled,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Document tag updated successfully",
        type: "success",
      }),
    )
    const onSuccess = action.meta.arg.onSuccess
    onSuccess()
  },
})
listenerMiddleware.startListening({
  actionCreator: updateDocumentTag.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Document tag update failed",
        type: "error",
      }),
    )
  },
})

export { listenerMiddleware as documentTagsMiddleware }
