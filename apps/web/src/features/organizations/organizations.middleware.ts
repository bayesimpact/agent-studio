import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { fetchMe } from "../me/me.thunks"
import { notificationsActions } from "../notifications/notifications.slice"
import { createOrganization } from "./organizations.thunks"

// Create typed listener middleware
const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

listenerMiddleware.startListening({
  actionCreator: createOrganization.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Organization created successfully",
        type: "success",
      }),
    )
    listenerApi.dispatch(fetchMe())
  },
})
listenerMiddleware.startListening({
  actionCreator: createOrganization.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({
        title: "Organization creation failed",
        type: "error",
      }),
    )
  },
})

export { listenerMiddleware as organizationsMiddleware }
