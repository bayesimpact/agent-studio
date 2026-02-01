import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import {
  createAppSession,
  createPlaygroundSession,
  loadSessionMessages,
} from "@/features/chat-sessions/chat-sessions.thunks"
import type { AppDispatch, RootState } from "@/store"
import type { ChatSession } from "./chat-sessions.models"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// When a playground session is created, automatically load its messages
listenerMiddleware.startListening({
  matcher: isAnyOf(createPlaygroundSession.fulfilled, createAppSession.fulfilled),
  effect: async (action, listenerApi) => {
    const session = action.payload as ChatSession
    await listenerApi.dispatch(loadSessionMessages(session.id))
  },
})

export { listenerMiddleware as chatSessionMiddleware }
