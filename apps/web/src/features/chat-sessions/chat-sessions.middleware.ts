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
import { selectChatBotsData } from "../chat-bots/chat-bots.selectors"
import { chatBotsActions } from "../chat-bots/chat-bots.slice"
import { createChatBot, listChatBots } from "../chat-bots/chat-bots.thunks"
import { selectCurrentChatSessionId } from "./chat-sessions.selectors"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

listenerMiddleware.startListening({
  actionCreator: listChatBots.fulfilled,
  effect: async ({ payload }, listenerApi) => {
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    for (const chatBot of payload) {
      listenerApi.dispatch(listSessions({ chatBotId: chatBot.id, playground: isAdminInterface }))
    }
  },
})

listenerMiddleware.startListening({
  actionCreator: createChatBot.fulfilled,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(chatBotsActions.setCurrentChatBotId({ chatBotId: action.payload.id }))
    await listenerApi.dispatch(createChatSession({ chatBotId: action.payload.id }))
  },
})

listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevSessionId = selectCurrentChatSessionId(originalState)
    const nextSessionId = selectCurrentChatSessionId(currentState)
    return prevSessionId !== nextSessionId
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
    const callback = action.meta.arg.onSuccess
    const state = listenerApi.getState()
    const isAdminInterface = selectIsAdminInterface(state)
    const { chatBotId, id } = action.payload
    await listenerApi.dispatch(listSessions({ chatBotId, playground: isAdminInterface }))
    callback?.(id)
  },
})

listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevInterface = selectIsAdminInterface(originalState)
    const nextInterface = selectIsAdminInterface(currentState)
    return prevInterface !== nextInterface
  },
  effect: async (_, listenerApi) => {
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
