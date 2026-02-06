import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { notificationsActions } from "../notifications/notifications.slice"
import { selectCurrentOrganizationId } from "../organizations/organizations.selectors"
import { selectCurrentProjectId } from "../projects/projects.selectors"
import { listProjects } from "../projects/projects.thunks"
import { listResources, uploadResource } from "./resources.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh resources when projects are loaded
listenerMiddleware.startListening({
  actionCreator: listProjects.fulfilled,
  effect: async (action, listenerApi) => {
    const projects = action.payload
    const state = listenerApi.getState()
    const organizationId = selectCurrentOrganizationId(state)
    if (!organizationId) return

    projects.forEach((project) => {
      listenerApi.dispatch(listResources({ organizationId, projectId: project.id }))
    })
  },
})

// Refresh resources when current project changes
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
    await listenerApi.dispatch(listResources({ organizationId, projectId }))
  },
})

listenerMiddleware.startListening({
  actionCreator: uploadResource.fulfilled,
  effect: async (action, listenerApi) => {
    const projectId = action.meta.arg.projectId
    const organizationId = action.meta.arg.organizationId
    // Refresh resources when one is uploaded
    listenerApi.dispatch(listResources({ organizationId, projectId }))

    listenerApi.dispatch(
      notificationsActions.show({
        title: "Resource uploaded successfully",
        type: "success",
      }),
    )

    const onSuccess = action.meta.arg.onSuccess
    const { id: resourceId } = action.payload
    onSuccess?.({ resourceId })
  },
})

listenerMiddleware.startListening({
  actionCreator: uploadResource.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Resource upload failed",
        type: "error",
      }),
    )
  },
})

export { listenerMiddleware as resourcesMiddleware }
