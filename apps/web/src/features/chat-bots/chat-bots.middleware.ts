import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { ADS } from "@/store/async-data-status"
import type { AppDispatch, RootState } from "@/store/types"
import { notificationsActions } from "../notifications/notifications.slice"
import { selectCurrentProjectId, selectProjectsData } from "../projects/projects.selectors"
import { listProjects } from "../projects/projects.thunks"
import { createChatBot, deleteChatBot, listChatBots, updateChatBot } from "./chat-bots.thunks"

// Create typed listener middleware
const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

listenerMiddleware.startListening({
  actionCreator: listProjects.fulfilled,
  effect: async (_, listenerApi) => {
    const projects = selectProjectsData(listenerApi.getState())
    if (!ADS.isFulfilled(projects)) return

    projects.value.forEach((project) => {
      listenerApi.dispatch(listChatBots({ projectId: project.id }))
    })
  },
})

listenerMiddleware.startListening({
  matcher: isAnyOf(deleteChatBot.fulfilled, createChatBot.fulfilled, updateChatBot.fulfilled),
  effect: async (_, listenerApi) => {
    const projectId = selectCurrentProjectId(listenerApi.getState())
    if (projectId) listenerApi.dispatch(listChatBots({ projectId }))
  },
})

listenerMiddleware.startListening({
  actionCreator: deleteChatBot.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Chat bot deleted successfully",
        type: "success",
      }),
    )
  },
})
listenerMiddleware.startListening({
  actionCreator: deleteChatBot.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Chat bot deletion failed",
        type: "error",
      }),
    )
  },
})

listenerMiddleware.startListening({
  actionCreator: createChatBot.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Chat bot created successfully",
        type: "success",
      }),
    )
  },
})
listenerMiddleware.startListening({
  actionCreator: createChatBot.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Chat bot creation failed",
        type: "error",
      }),
    )
  },
})

listenerMiddleware.startListening({
  actionCreator: updateChatBot.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Chat bot updated successfully",
        type: "success",
      }),
    )
  },
})
listenerMiddleware.startListening({
  actionCreator: updateChatBot.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Chat bot update failed",
        type: "error",
      }),
    )
  },
})

export { listenerMiddleware as chatBotsMiddleware }
