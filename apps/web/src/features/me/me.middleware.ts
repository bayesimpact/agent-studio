import { createListenerMiddleware } from "@reduxjs/toolkit"
import { logoutAuth0 } from "@/external/auth0Client"
import { ADS } from "@/store/async-data-status"
import type { AppDispatch, RootState } from "@/store/types"
import { notificationsActions } from "../notifications/notifications.slice"
import { hasOrganizationChanged } from "../organizations/organizations.selectors"
import { hasProjectChanged } from "../projects/projects.selectors"
import { selectMe } from "./me.selectors"
import { fetchMe, setAbilities } from "./me.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

listenerMiddleware.startListening({
  predicate(_, currentState, originalState) {
    return (
      hasOrganizationChanged(originalState, currentState) ||
      hasProjectChanged(originalState, currentState)
    )
  },
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const me = selectMe(state)
    if (!ADS.isFulfilled(me)) return
    listenerApi.dispatch(setAbilities({ memberships: me.value.memberships }))
  },
})

listenerMiddleware.startListening({
  actionCreator: fetchMe.rejected,
  effect: async (action, listenerApi) => {
    const httpStatus = action.payload?.status
    const isUnauthorizedRequest = httpStatus === 401 || httpStatus === 403

    if (isUnauthorizedRequest) {
      // Only force logout for auth failures. Network/CORS errors should surface in UI.
      localStorage.clear()
      await logoutAuth0()
      return
    }

    listenerApi.dispatch(
      notificationsActions.show({
        title: "Unable to reach the API",
        description:
          "Please check that the API is running and CORS is configured for this web app origin.",
        type: "error",
      }),
    )
  },
})

export { listenerMiddleware as meMiddleware }
