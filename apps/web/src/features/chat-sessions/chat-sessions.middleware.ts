import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import {
  createAppSession,
  createPlaygroundSession,
  listSessions,
  loadSessionMessages,
} from "@/features/chat-sessions/chat-sessions.thunks"
import type { AppDispatch, RootState } from "@/store"
import { listChatBots } from "../chat-bots/chat-bots.thunks"
import { chatSessionsActions } from "./chat-sessions.slice"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

listenerMiddleware.startListening({
  actionCreator: listChatBots.fulfilled,
  effect: async (action, listenerApi) => {
    const chatBots = action.payload

    chatBots.forEach((chatBot) => {
      listenerApi.dispatch(listSessions({ chatBotId: chatBot.id, playground: false }))
    })
  },
})

listenerMiddleware.startListening({
  actionCreator: chatSessionsActions.setCurrentChatSessionId,
  effect: async (action, listenerApi) => {
    const { chatSessionId } = action.payload
    if (!chatSessionId) return
    await listenerApi.dispatch(loadSessionMessages(chatSessionId))
  },
})

listenerMiddleware.startListening({
  actionCreator: createPlaygroundSession.fulfilled,
  effect: async (action, listenerApi) => {
    const { chatbotId } = action.payload
    await listenerApi.dispatch(listSessions({ chatBotId: chatbotId, playground: true }))
  },
})

listenerMiddleware.startListening({
  actionCreator: createAppSession.fulfilled,
  effect: async (action, listenerApi) => {
    const { chatbotId } = action.payload
    await listenerApi.dispatch(listSessions({ chatBotId: chatbotId, playground: false }))
  },
})

export { listenerMiddleware as chatSessionMiddleware }
