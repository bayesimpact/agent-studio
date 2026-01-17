import { createListenerMiddleware } from "@reduxjs/toolkit"
import { setToken } from "@/features/auth/auth.slice"
import { meSlice } from "@/features/me/me.slice"
import { fetchMe } from "@/features/me/me.thunks"
import { organizationsSlice } from "@/features/organizations/organizations.slice"

export const listenerMiddleware = createListenerMiddleware()

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
      listenerApi.dispatch(meSlice.actions.reset()) // Clears user (sets to null)
      listenerApi.dispatch(organizationsSlice.actions.reset()) // Clears organizations (sets to [])
    }
  },
})
