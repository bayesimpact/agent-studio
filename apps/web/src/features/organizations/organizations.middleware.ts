import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { initOrganization } from "../global.thunks"
import { fetchMe } from "../me/me.thunks"
import { notificationsActions } from "../notifications/notifications.slice"
import { selectCurrentOrganizationId } from "./organizations.selectors"
import { createOrganization } from "./organizations.thunks"

// Create typed listener middleware
const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// When the current organization changes, initialize the organization data
listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    const prevOrgId = selectCurrentOrganizationId(originalState)
    const currOrgId = selectCurrentOrganizationId(currentState)
    return prevOrgId !== currOrgId
  },
  effect: async (_, listenerApi) => {
    const organizationId = selectCurrentOrganizationId(listenerApi.getState())
    if (!organizationId) return
    await listenerApi.dispatch(initOrganization({ organizationId }))
  },
})

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
