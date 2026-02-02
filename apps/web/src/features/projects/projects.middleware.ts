import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { notificationsActions } from "../notifications/notifications.slice"
import { selectCurrentOrganizationId } from "../organizations/organizations.selectors"
import type { Project } from "./projects.models"
import { createProject, deleteProject, listProjects, updateProject } from "./projects.thunks"

// Create typed listener middleware
const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

listenerMiddleware.startListening({
  matcher: isAnyOf(deleteProject.fulfilled, createProject.fulfilled, updateProject.fulfilled),
  effect: async (action, listenerApi) => {
    const organizationId = selectCurrentOrganizationId(listenerApi.getState())
    if (!organizationId) throw new Error("No organization selected")

    await listenerApi.dispatch(listProjects({ organizationId }))

    if (action.type === createProject.fulfilled.type) {
      const callback = (action.meta as { arg: { onSuccess: (projectId: string) => void } }).arg
        .onSuccess
      const { id } = action.payload as Project
      callback(id)
    }
  },
})

listenerMiddleware.startListening({
  actionCreator: deleteProject.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Project deleted successfully",
        type: "success",
      }),
    )
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
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Project created successfully",
        type: "success",
      }),
    )
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
