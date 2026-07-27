import { createListenerMiddleware } from "@reduxjs/toolkit"
import { getCurrentId } from "@/common/features/helpers"
import type { AppDispatch, RootState } from "@/common/store/types"
import { agentSettingsActions } from "./agent-settings.slice"
import {
  archiveAgentSettings,
  listAgentSettings,
  publishAgentSettings,
  restoreAgentSettings,
  updateAgentSettings,
} from "./agent-settings.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

// Refetch after every mutation, including a rejected one: a tab may save through two
// endpoints in sequence, so a failed second call can leave the first already applied,
// and only a refetch shows the true state.
const mutationsToRefetchOn = [
  updateAgentSettings.fulfilled,
  updateAgentSettings.rejected,
  publishAgentSettings.fulfilled,
  archiveAgentSettings.fulfilled,
  restoreAgentSettings.fulfilled,
] as const

function registerListeners() {
  listenerMiddleware.startListening({
    actionCreator: agentSettingsActions.mount,
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState()
      const agentId = getCurrentId({ state, name: "agentId" })
      listenerApi.dispatch(listAgentSettings({ agentId }))
    },
  })

  for (const mutationAction of mutationsToRefetchOn) {
    listenerMiddleware.startListening({
      actionCreator: mutationAction,
      effect: async (action, listenerApi) => {
        listenerApi.dispatch(listAgentSettings({ agentId: action.meta.arg.agentId }))
      },
    })
  }
}

export const agentSettingsMiddleware = { listenerMiddleware, registerListeners }
