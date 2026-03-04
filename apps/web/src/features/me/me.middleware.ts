import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import { logoutAuth0 } from "@/external/auth0Client"
import type { AppDispatch, RootState } from "@/store/types"
import { fetchMe } from "./me.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

listenerMiddleware.startListening({
  actionCreator: fetchMe.rejected,
  effect: async () => {
    // we couldn't fetch or create the user, we take no risks and logout the user
    localStorage.clear()
    await logoutAuth0()
  },
})

export { listenerMiddleware as meMiddleware }
