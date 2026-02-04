import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import {
  createChatSession,
  listSessions,
  loadSessionMessages,
} from "@/features/chat-sessions/chat-sessions.thunks"
import type { AppDispatch, RootState } from "@/store"
import { ADS } from "@/store/async-data-status"
import { selectIsAdminInterface } from "../auth/auth.selectors"
import { selectChatBotsData, selectCurrentChatBotId } from "../chat-bots/chat-bots.selectors"
import { listChatBots } from "../chat-bots/chat-bots.thunks"
import { selectCurrentChatSessionId } from "./chat-sessions.selectors"
import { chatSessionsActions } from "./chat-sessions.slice"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh chat sessions when chat bots are loaded
listenerMiddleware.startListening({
  actionCreator: listChatBots.fulfilled,
  effect: async ({ payload: chatBots }, listenerApi) => {
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    chatBots.forEach((chatBot) => {
      listenerApi.dispatch(listSessions({ chatBotId: chatBot.id, playground: isAdminInterface }))
    })
  },
})

// Refresh chat sessions when current chat bot changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevId = selectCurrentChatBotId(originalState)
    const nextId = selectCurrentChatBotId(currentState)
    return prevId !== nextId
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const chatBotId = selectCurrentChatBotId(state)
    const isAdminInterface = selectIsAdminInterface(state)
    if (!chatBotId) return
    await listenerApi.dispatch(listSessions({ chatBotId, playground: isAdminInterface }))
  },
})

// Refresh messages when current chat sessions are loaded and one is selected
listenerMiddleware.startListening({
  actionCreator: listSessions.fulfilled,
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const chatSessionId = selectCurrentChatSessionId(state)
    if (!chatSessionId) return
    await listenerApi.dispatch(loadSessionMessages(chatSessionId))
  },
})

// Refresh messages when current chat session changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevId = selectCurrentChatSessionId(originalState)
    const nextId = selectCurrentChatSessionId(currentState)
    return prevId !== nextId
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const chatSessionId = selectCurrentChatSessionId(state)
    if (!chatSessionId) return
    await listenerApi.dispatch(loadSessionMessages(chatSessionId))
  },
})

listenerMiddleware.startListening({
  actionCreator: createChatSession.fulfilled,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    const { chatBotId, id } = action.payload
    await listenerApi.dispatch(listSessions({ chatBotId, playground: isAdminInterface }))

    const onSuccess = action.meta.arg.onSuccess
    onSuccess?.(id)
  },
})

// Refresh chat sessions when interface type changes
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevInterface = selectIsAdminInterface(originalState)
    const nextInterface = selectIsAdminInterface(currentState)
    return prevInterface !== nextInterface
  },
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(chatSessionsActions.reset())
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    const chatBots = selectChatBotsData(state)
    if (ADS.isFulfilled(chatBots)) {
      for (const chatBot of Object.values(chatBots.value).flat()) {
        await listenerApi.dispatch(
          listSessions({ chatBotId: chatBot.id, playground: isAdminInterface }),
        )
      }
    }
  },
})

export { listenerMiddleware as chatSessionMiddleware }
