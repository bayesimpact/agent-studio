import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { notificationsActions } from "../notifications/notifications.slice"
import { selectCurrentProjectId } from "../projects/projects.selectors"
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
    const prevId = selectCurrentProjectId(originalState)
    const nextId = selectCurrentProjectId(currentState)
    return prevId !== nextId && !!nextId
  },
  effect: async (_, listenerApi) => {
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
    const id = action.meta.arg.documentTagId
    onSuccess?.(id)
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
    onSuccess?.(action.payload)
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
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Document tag updated successfully",
        type: "success",
      }),
    )
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
