import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { ADS } from "@/store/async-data-status"
import type { AppDispatch, RootState } from "@/store/types"
import { notificationsActions } from "../notifications/notifications.slice"
import { selectCurrentProjectId, selectProjectsData } from "../projects/projects.selectors"
import { listProjects } from "../projects/projects.thunks"
import { createChatBot, deleteChatBot, listChatBots, updateChatBot } from "./chat-bots.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh chat bots when projects are loaded
listenerMiddleware.startListening({
  actionCreator: listProjects.fulfilled,
  effect: async (action, listenerApi) => {
    const projects = action.payload
    projects.forEach((project) => {
      listenerApi.dispatch(listChatBots({ projectId: project.id }))
    })
  },
})

// Refresh chat bots when current project changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevId = selectCurrentProjectId(originalState)
    const nextId = selectCurrentProjectId(currentState)
    return prevId !== nextId
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const projectId = selectCurrentProjectId(state)
    if (!projectId) return
    await listenerApi.dispatch(listChatBots({ projectId }))
  },
})

// Refresh chat bots when one is created, updated or deleted
listenerMiddleware.startListening({
  matcher: isAnyOf(deleteChatBot.fulfilled, createChatBot.fulfilled, updateChatBot.fulfilled),
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const projects = selectProjectsData(state)
    if (!ADS.isFulfilled(projects)) return
    projects.value.forEach((project) => {
      listenerApi.dispatch(listChatBots({ projectId: project.id }))
    })
  },
})

listenerMiddleware.startListening({
  actionCreator: deleteChatBot.fulfilled,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Chat bot deleted successfully",
        type: "success",
      }),
    )

    const onSuccess = action.meta.arg.onSuccess
    const id = action.meta.arg.chatBotId
    onSuccess?.(id)
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
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Chat bot created successfully",
        type: "success",
      }),
    )

    const onSuccess = action.meta.arg.onSuccess
    const { id } = action.payload
    onSuccess?.(id)
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
