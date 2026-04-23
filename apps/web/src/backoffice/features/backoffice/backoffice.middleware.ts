import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import type { AppDispatch, RootState } from "@/common/store/types"
import { backofficeActions } from "./backoffice.slice"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

function registerListeners() {
  listenerMiddleware.startListening({
    actionCreator: backofficeActions.mount,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(backofficeActions.listOrganizations())
      listenerApi.dispatch(backofficeActions.listUsers())
    },
  })
  listenerMiddleware.startListening({
    actionCreator: backofficeActions.unmount,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(backofficeActions.reset())
    },
  })

  listenerMiddleware.startListening({
    matcher: isAnyOf(
      backofficeActions.addFeatureFlag.fulfilled,
      backofficeActions.removeFeatureFlag.fulfilled,
    ),
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Feature flag updated",
          type: "success",
        }),
      )
    },
  })

  listenerMiddleware.startListening({
    matcher: isAnyOf(
      backofficeActions.addFeatureFlag.rejected,
      backofficeActions.removeFeatureFlag.rejected,
    ),
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Feature flag update failed",
          type: "error",
        }),
      )
    },
  })
}

export const backofficeMiddleware = { listenerMiddleware, registerListeners }
