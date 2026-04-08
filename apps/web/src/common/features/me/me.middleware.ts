import { createListenerMiddleware } from "@reduxjs/toolkit"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import { hasOrganizationChanged } from "@/common/features/organizations/organizations.selectors"
import { hasProjectChanged } from "@/common/features/projects/projects.selectors"
import { ADS } from "@/common/store/async-data-status"
import type { AppDispatch, RootState } from "@/common/store/types"
import { logoutAuth0 } from "@/external/auth0Client"
import { selectMe } from "./me.selectors"
import { computeAbilities, fetchMe } from "./me.thunks"

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
    listenerApi.dispatch(computeAbilities({ memberships: me.value.memberships }))
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
