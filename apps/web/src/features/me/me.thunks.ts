import { createAsyncThunk } from "@reduxjs/toolkit"
import { isAxiosError } from "axios"
import { RouteNames } from "@/routes/helpers"
import type { RootState, ThunkExtraArg } from "@/store"
import type { UserMembershipsDto } from "../../../../../packages/api-contracts/src/me/me.dto"
import { selectCurrentAgentId } from "../agents/agents.selectors"
import { authActions } from "../auth/auth.slice"
import { selectCurrentOrganizationId } from "../organizations/organizations.selectors"
import { selectCurrentProjectId } from "../projects/projects.selectors"
import type { Me } from "./me.models"

type FetchMeRejectedValue = {
  status?: number
}

type ThunkConfig = {
  state: RootState
  extra: ThunkExtraArg
  rejectValue: FetchMeRejectedValue
}

const adminRoles = ["admin", "owner"]
const roles = [...adminRoles, "member"]

function compute(
  memberships: Me["user"]["memberships"],
  organizationId: string | null | undefined,
  projectId: string | null | undefined,
  agentId: string | null | undefined,
) {
  const orgMembership = memberships.organizationMemberships.find(
    (membership) => membership.organizationId === organizationId,
  )
  const projectMembership = memberships.projectMemberships.find(
    (membership) => membership.projectId === projectId,
  )
  const agentMembership = memberships.agentMemberships.find(
    (membership) => membership.agentId === agentId,
  )

  // From onboarding
  const canManageFirstOrganization = !!(
    !organizationId &&
    memberships.organizationMemberships[0] &&
    adminRoles.includes(memberships.organizationMemberships[0].role)
  )
  return {
    canManageOrganizations: orgMembership
      ? adminRoles.includes(orgMembership.role)
      : canManageFirstOrganization,
    canManageProjects: projectMembership ? adminRoles.includes(projectMembership.role) : false,
    canReadAgent: agentMembership ? roles.includes(agentMembership.role) : false,
  }
}

export const fetchMe = createAsyncThunk<Me, void, ThunkConfig>(
  "me/fetch",
  async (_, { extra: { services }, rejectWithValue, dispatch }) => {
    try {
      const me = await services.me.getMe()
      const {
        user: { memberships },
      } = me

      dispatch(computeAbilities({ memberships }))

      return me
    } catch (error) {
      if (isAxiosError(error)) {
        return rejectWithValue({ status: error.response?.status })
      }
      throw error
    }
  },
)
export const computeAbilities = createAsyncThunk<
  void,
  { memberships: UserMembershipsDto },
  ThunkConfig
>("me/computeAbilities", async ({ memberships }, { getState, dispatch }) => {
  const state = getState()

  const abilities = compute(
    memberships,
    selectCurrentOrganizationId(state),
    selectCurrentProjectId(state),
    selectCurrentAgentId(state),
  )

  dispatch(authActions.setAbilities(abilities))

  const canAccessStudio = abilities.canManageOrganizations || abilities.canManageProjects
  const isStudioPath = window.location.pathname.startsWith(RouteNames.STUDIO)
  dispatch(authActions.setIsStudioInterface(canAccessStudio && isStudioPath))

  dispatch(authActions.setStopLoading())
})
