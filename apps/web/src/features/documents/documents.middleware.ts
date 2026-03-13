import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { hasInterfaceChanged, selectIsAdminInterface } from "../auth/auth.selectors"
import {
  createDocumentTag,
  deleteDocumentTag,
  updateDocumentTag,
} from "../document-tags/document-tags.thunks"
import { notificationsActions } from "../notifications/notifications.slice"
import { hasProjectChanged } from "../projects/projects.selectors"
import { deleteDocument, listDocuments, updateDocument, uploadDocument } from "./documents.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh documents when current project or interface changes
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

    await listenerApi.dispatch(listDocuments())
  },
})

// Refresh documents when one is uploaded, updated or deleted
listenerMiddleware.startListening({
  matcher: isAnyOf(
    // Document changes
    uploadDocument.fulfilled,
    updateDocument.fulfilled,
    deleteDocument.fulfilled,
    // DocumentTag changes
    createDocumentTag.fulfilled,
    updateDocumentTag.fulfilled,
    deleteDocumentTag.fulfilled,
  ),
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(listDocuments())
  },
})

listenerMiddleware.startListening({
  actionCreator: uploadDocument.fulfilled,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Document uploaded successfully",
        type: "success",
      }),
    )

    const onSuccess = action.meta.arg.onSuccess
    const { id: documentId } = action.payload
    onSuccess?.({ documentId })
  },
})
listenerMiddleware.startListening({
  actionCreator: uploadDocument.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Document upload failed",
        type: "error",
      }),
    )
  },
})

listenerMiddleware.startListening({
  actionCreator: updateDocument.fulfilled,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Document updated successfully",
        type: "success",
      }),
    )

    const onSuccess = action.meta.arg.onSuccess
    onSuccess?.()
  },
})
listenerMiddleware.startListening({
  actionCreator: updateDocument.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Document update failed",
        type: "error",
      }),
    )
  },
})

listenerMiddleware.startListening({
  actionCreator: deleteDocument.fulfilled,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Document deleted successfully",
        type: "success",
      }),
    )

    const onSuccess = action.meta.arg.onSuccess
    onSuccess?.()
  },
})
listenerMiddleware.startListening({
  actionCreator: deleteDocument.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Document deletion failed",
        type: "error",
      }),
    )
  },
})

export { listenerMiddleware as documentsMiddleware }
