import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { notificationsActions } from "../notifications/notifications.slice"
import { hasOrganizationChanged } from "../organizations/organizations.selectors"
import { createProject, deleteProject, listProjects, updateProject } from "./projects.thunks"

// Create typed listener middleware
const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

// List projects when the current organization changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    return hasOrganizationChanged(originalState, currentState)
  },
  effect: async (_, listenerApi) => {
    await listenerApi.dispatch(listProjects())
  },
})

listenerMiddleware.startListening({
  matcher: isAnyOf(deleteProject.fulfilled, createProject.fulfilled, updateProject.fulfilled),
  effect: async (_, listenerApi) => {
    await listenerApi.dispatch(listProjects())
  },
})

listenerMiddleware.startListening({
  actionCreator: deleteProject.fulfilled,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Project deleted successfully",
        type: "success",
      }),
    )

    const onSuccess = action.meta.arg.onSuccess
    onSuccess?.()
  },
})
listenerMiddleware.startListening({
  actionCreator: deleteProject.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Project deletion failed",
        type: "error",
      }),
    )
  },
})

listenerMiddleware.startListening({
  actionCreator: createProject.fulfilled,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Project created successfully",
        type: "success",
      }),
    )

    const onSuccess = action.meta.arg.onSuccess
    const { id } = action.payload
    onSuccess?.(id)
  },
})
listenerMiddleware.startListening({
  actionCreator: createProject.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Project creation failed",
        type: "error",
      }),
    )
  },
})

listenerMiddleware.startListening({
  actionCreator: updateProject.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Project updated successfully",
        type: "success",
      }),
    )
  },
})
listenerMiddleware.startListening({
  actionCreator: updateProject.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Project update failed",
        type: "error",
      }),
    )
  },
})

export { listenerMiddleware as projectsMiddleware }
