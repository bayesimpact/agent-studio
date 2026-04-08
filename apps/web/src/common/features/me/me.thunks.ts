import type { UserMembershipsDto } from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { isAxiosError } from "axios"
import { selectCurrentAgentId } from "@/common/features/agents/agents.selectors"
import { selectCurrentOrganizationId } from "@/common/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import type { RootState, ThunkExtraArg } from "@/common/store"
import { authActions } from "../auth/auth.slice"
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

  const canManageOrganizations = orgMembership
    ? adminRoles.includes(orgMembership.role)
    : canManageFirstOrganization

  const canManageProjects = projectMembership ? adminRoles.includes(projectMembership.role) : false

  return {
    canAccessStudio: canManageOrganizations || canManageProjects,
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

  dispatch(authActions.setStopLoading())
})
