import { createListenerMiddleware, isAnyOf, type UnknownAction } from "@reduxjs/toolkit"
import { listAgents } from "@/common/features/agents/agents.thunks"
import { updateAgentSettings } from "@/common/features/agents/settings/agent-settings.thunks"
import { fetchMe } from "@/common/features/me/me.thunks"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import type { AppDispatch, RootState } from "@/common/store/types"
import {
  createAgent,
  deleteAgent,
  renameAgent,
  saveAgentGeneral,
  saveAgentSources,
  updateAgentDocumentTags,
  updateAgentResourceLibraries,
  updateAgentSessionCategories,
} from "@/studio/features/agents/agents.thunks"
import {
  deleteDocumentTag,
  updateDocumentTag,
} from "@/studio/features/document-tags/document-tags.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

/**
 * True when the thunk that dispatched this action was told `silent: true`. Composite thunks
 * (saveAgentGeneral, saveAgentSources) set this on the sub-thunks they dispatch internally, so
 * their own fulfilled/rejected is the only one that produces a user-facing notification and
 * refetch.
 */
function isSilent(action: UnknownAction): boolean {
  const meta = action.meta
  if (typeof meta !== "object" || meta === null || !("arg" in meta)) return false
  const arg = meta.arg
  if (typeof arg !== "object" || arg === null || !("silent" in arg)) return false
  return arg.silent === true
}

function registerListeners() {
  listenerMiddleware.startListening({
    matcher: isAnyOf(
      // DocumentTag changes
      updateDocumentTag.fulfilled,
      deleteDocumentTag.fulfilled,
    ),
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(listAgents())
    },
  })

  listenerMiddleware.startListening({
    actionCreator: deleteAgent.fulfilled,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Agent deleted successfully",
          type: "success",
        }),
      )
    },
  })
  listenerMiddleware.startListening({
    actionCreator: deleteAgent.rejected,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Agent deletion failed",
          type: "error",
        }),
      )
    },
  })

  listenerMiddleware.startListening({
    actionCreator: createAgent.fulfilled,
    effect: async (action, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Agent created successfully",
          type: "success",
        }),
      )

      const onSuccess = action.meta.arg.onSuccess
      onSuccess?.(action.payload)

      listenerApi.dispatch(fetchMe()) // To update agent membership and then abilities
    },
  })
  listenerMiddleware.startListening({
    actionCreator: createAgent.rejected,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "Agent creation failed",
          type: "error",
        }),
      )
    },
  })

  listenerMiddleware.startListening({
    matcher: isAnyOf(
      saveAgentGeneral.fulfilled,
      saveAgentSources.fulfilled,
      renameAgent.fulfilled,
      updateAgentDocumentTags.fulfilled,
      updateAgentResourceLibraries.fulfilled,
      updateAgentSessionCategories.fulfilled,
      updateAgentSettings.fulfilled,
    ),
    effect: async (action, listenerApi) => {
      // A composite thunk's sub-dispatches are silent: the composite's own fulfilled/rejected
      // (matched separately here, since it isn't silent) owns the single notification + refetch.
      if (isSilent(action)) return

      listenerApi.dispatch(listAgents())

      listenerApi.dispatch(
        notificationsActions.show({
          title: "Agent updated successfully",
          type: "success",
        }),
      )
    },
  })

  listenerMiddleware.startListening({
    matcher: isAnyOf(
      saveAgentGeneral.rejected,
      saveAgentSources.rejected,
      renameAgent.rejected,
      updateAgentDocumentTags.rejected,
      updateAgentResourceLibraries.rejected,
      updateAgentSessionCategories.rejected,
      updateAgentSettings.rejected,
    ),
    effect: async (action, listenerApi) => {
      if (isSilent(action)) return

      listenerApi.dispatch(
        notificationsActions.show({
          title: "Agent update failed",
          type: "error",
        }),
      )
    },
  })
}
export const studioAgentsMiddleware = { listenerMiddleware, registerListeners }
