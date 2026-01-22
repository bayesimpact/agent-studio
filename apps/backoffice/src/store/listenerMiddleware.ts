import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import { setToken } from "@/features/auth/auth.slice"
import { meSlice } from "@/features/me/me.slice"
import { fetchMe } from "@/features/me/me.thunks"
import { organizationsSlice } from "@/features/organizations/organizations.slice"
import type { AppDispatch, RootState } from "./types"

// Create typed listener middleware
export const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Listen for token changes and automatically fetch user data
listenerMiddleware.startListening({
  actionCreator: setToken,
  effect: async (action, listenerApi) => {
    const token = action.payload

    if (token) {
      // Token was set - fetch user data
      await listenerApi.dispatch(fetchMe())
    } else {
      // Token was cleared (logout) - clear user and organizations state
      listenerApi.dispatch(meSlice.actions.reset())
      listenerApi.dispatch(organizationsSlice.actions.reset())
    }
  },
})
