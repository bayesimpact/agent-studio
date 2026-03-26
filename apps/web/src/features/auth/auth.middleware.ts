import type { ListenerEffectAPI, TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { consumePendingInvitation } from "@/routes/HomeRoute"
import { ADS } from "@/store/async-data-status"
import type { AppDispatch, RootState } from "@/store/types"
import { selectCurrentAgentId } from "../agents/agents.selectors"
import { agentsActions } from "../agents/agents.slice"
import { acceptInvitation } from "../invitations/invitations.thunks"
import type { User } from "../me/me.models"
import { selectMe } from "../me/me.selectors"
import { meActions } from "../me/me.slice"
import { fetchMe } from "../me/me.thunks"
import { selectCurrentOrganizationId } from "../organizations/organizations.selectors"
import { organizationsActions } from "../organizations/organizations.slice"
import { selectCurrentProjectId } from "../projects/projects.selectors"
import { projectsActions } from "../projects/projects.slice"
import { authActions } from "./auth.slice"

// Create typed listener middleware
const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Listen for authentication state changes and automatically fetch user data
listenerMiddleware.startListening({
  actionCreator: authActions.setAuthenticated,
  effect: async (action, listenerApi) => {
    const isAuthenticated = action.payload

    if (isAuthenticated) {
      // Check for a pending invitation BEFORE fetching /me.
      // This is critical: /me triggers UserGuard.findOrCreate which would create
      // a duplicate user. acceptInvitation reconciles the placeholder user's
      // auth0Id first, so /me then finds the correct existing user.
      const pendingTicketId = consumePendingInvitation()
      if (pendingTicketId) {
        await listenerApi.dispatch(acceptInvitation({ ticketId: pendingTicketId }))
      }

      // Now fetch user data (will find the reconciled user, not create a new one)
      await listenerApi.dispatch(fetchMe())
    } else {
      // User logged out - clear user and organizations state
      listenerApi.dispatch(meActions.reset())
      listenerApi.dispatch(organizationsActions.reset())
    }
  },
})

function addMembershipRoleListener<T extends { id: string; role: string }>({
  matcher,
  selectCurrentId,
  getMemberships,
  onRole,
  resourceIdName,
}: {
  matcher: (v: unknown) => boolean
  selectCurrentId: (state: RootState) => string | undefined | null
  getMemberships: (memberships: User["memberships"]) => T[]
  onRole: (
    listenerApi: ListenerEffectAPI<RootState, AppDispatch>,
    role: T["role"] | undefined,
  ) => void
  resourceIdName: "organizationId" | "projectId" | "agentId"
}): void {
  listenerMiddleware.startListening({
    // biome-ignore lint/suspicious/noExplicitAny: RTK matcher type
    matcher: matcher as (v: unknown) => v is any,
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState()
      const user = selectMe(state)
      const currentId = selectCurrentId(state)

      if (!ADS.isFulfilled(user)) return

      const role = getMemberships(user.value.memberships).find(
        //@ts-expect-error dynamic access
        (membership) => membership[resourceIdName] === currentId,
      )?.role
      onRole(listenerApi, role)
    },
  })
}

addMembershipRoleListener({
  resourceIdName: "organizationId",
  matcher: isAnyOf(organizationsActions.setCurrentOrganizationId, fetchMe.fulfilled),
  selectCurrentId: selectCurrentOrganizationId,
  getMemberships: (memberships) => memberships.organizationMemberships,
  onRole: (listenerApi, organizationRole) =>
    listenerApi.dispatch(authActions.setCanManageOrganizations({ organizationRole })),
})

addMembershipRoleListener({
  resourceIdName: "projectId",
  matcher: isAnyOf(projectsActions.setCurrentProjectId, fetchMe.fulfilled),
  selectCurrentId: selectCurrentProjectId,
  getMemberships: (memberships) => memberships.projectMemberships,
  onRole: (listenerApi, projectRole) =>
    listenerApi.dispatch(authActions.setCanManageProjects({ projectRole })),
})

addMembershipRoleListener({
  resourceIdName: "agentId",
  matcher: isAnyOf(agentsActions.setCurrentAgentId, fetchMe.fulfilled),
  selectCurrentId: selectCurrentAgentId,
  getMemberships: (memberships) => memberships.agentMemberships,
  onRole: (listenerApi, agentRole) =>
    listenerApi.dispatch(authActions.setCanReadAgent({ agentRole })),
})

export { listenerMiddleware as authMiddleware }
