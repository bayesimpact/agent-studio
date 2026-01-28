import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import {
  createPlaygroundSession,
  loadSessionMessages,
} from "@/features/chat-session/chat-session.thunks"
import type { AppDispatch, RootState } from "@/store"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// When a playground session is created, automatically load its messages
listenerMiddleware.startListening({
  actionCreator: createPlaygroundSession.fulfilled,
  effect: async (action, listenerApi) => {
    const session = action.payload
    await listenerApi.dispatch(loadSessionMessages(session.id))
  },
})

export { listenerMiddleware as chatSessionMiddleware }
