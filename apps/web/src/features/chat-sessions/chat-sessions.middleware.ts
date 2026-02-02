import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import {
  createAppSession,
  createPlaygroundSession,
  listSessions,
  loadSessionMessages,
} from "@/features/chat-sessions/chat-sessions.thunks"
import type { AppDispatch, RootState } from "@/store"
import { chatSessionsActions } from "./chat-sessions.slice"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// FIXME: when admin will be available on user
//  listenerMiddleware.startListening({
//   actionCreator: listChatBots.fulfilled,
//   effect: async (action, listenerApi) => {
//     const chatBots = action.payload

//     const admin = listenerApi.getState().me.data.value?.admin
//     chatBots.forEach((chatBot) => {
//     listenerApi.dispatch(listSessions({ chatBotId: chatBot.id, playground: !!admin }))
//      })
//   },
// })

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
    const callback = action.meta.arg.onSuccess
    const { chatBotId, id } = action.payload
    await listenerApi.dispatch(listSessions({ chatBotId, playground: true }))
    callback(id)
  },
})

listenerMiddleware.startListening({
  actionCreator: createAppSession.fulfilled,
  effect: async (action, listenerApi) => {
    const callback = action.meta.arg.onSuccess
    const { chatBotId, id } = action.payload
    await listenerApi.dispatch(listSessions({ chatBotId, playground: false }))
    callback(id)
  },
})

export { listenerMiddleware as chatSessionMiddleware }
