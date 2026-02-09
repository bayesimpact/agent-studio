import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { notificationsActions } from "../notifications/notifications.slice"
import { selectCurrentOrganizationId } from "../organizations/organizations.selectors"
import { selectCurrentProjectId } from "../projects/projects.selectors"
import { listProjects } from "../projects/projects.thunks"
import { deleteDocument, listDocuments, uploadDocument } from "./documents.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh documents when projects are loaded
listenerMiddleware.startListening({
  actionCreator: listProjects.fulfilled,
  effect: async (action, listenerApi) => {
    const projects = action.payload
    const state = listenerApi.getState()
    const organizationId = selectCurrentOrganizationId(state)
    if (!organizationId) return

    projects.forEach((project) => {
      listenerApi.dispatch(listDocuments({ organizationId, projectId: project.id }))
    })
  },
})

// Refresh documents when current project changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevId = selectCurrentProjectId(originalState)
    const nextId = selectCurrentProjectId(currentState)
    return prevId !== nextId
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const projectId = selectCurrentProjectId(state)
    const organizationId = selectCurrentOrganizationId(state)
    if (!projectId || !organizationId) return
    await listenerApi.dispatch(listDocuments({ organizationId, projectId }))
  },
})

listenerMiddleware.startListening({
  actionCreator: uploadDocument.fulfilled,
  effect: async (action, listenerApi) => {
    const projectId = action.meta.arg.projectId
    const organizationId = action.meta.arg.organizationId
    // Refresh documents when one is uploaded
    listenerApi.dispatch(listDocuments({ organizationId, projectId }))

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
  actionCreator: deleteDocument.fulfilled,
  effect: async (action, listenerApi) => {
    const projectId = action.meta.arg.projectId
    const organizationId = action.meta.arg.organizationId
    // Refresh Documents when one is deleted
    listenerApi.dispatch(listDocuments({ organizationId, projectId }))

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
