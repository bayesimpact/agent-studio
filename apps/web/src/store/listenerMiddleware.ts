import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import { setAuthenticated } from "@/features/auth/auth.slice"
import { meSlice } from "@/features/me/me.slice"
import { fetchMe } from "@/features/me/me.thunks"
import { organizationsActions } from "@/features/organizations/organizations.slice"
import type { AppDispatch, RootState } from "./types"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Listen for authentication state changes and automatically fetch user data
listenerMiddleware.startListening({
  actionCreator: setAuthenticated,
  effect: async (action, listenerApi) => {
    const isAuthenticated = action.payload

    if (isAuthenticated) {
      // User became authenticated - fetch user data
      await listenerApi.dispatch(fetchMe())
    } else {
      // User logged out - clear user and organizations state
      listenerApi.dispatch(meSlice.actions.reset())
      listenerApi.dispatch(organizationsActions.reset())
    }
  },
})
