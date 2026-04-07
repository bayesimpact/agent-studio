import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/common/store"
import { getCurrentIds } from "@/features/helpers"
import type { AgentMembership } from "./agent-memberships.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listAgentMemberships = createAsyncThunk<AgentMembership[], void, ThunkConfig>(
  "agentMemberships/list",
  async (_, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId, agentId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId", "agentId"],
    })
    return await services.agentMemberships.getAll({ organizationId, projectId, agentId })
  },
)

export const inviteAgentMembers = createAsyncThunk<
  AgentMembership[],
  { emails: string[] },
  ThunkConfig
>("agentMemberships/invite", async ({ emails }, { extra: { services }, getState }) => {
  const state = getState()
  const { organizationId, projectId, agentId } = getCurrentIds({
    state,
    wantedIds: ["organizationId", "projectId", "agentId"],
  })
  return await services.agentMemberships.invite({ organizationId, projectId, agentId, emails })
})

export const removeAgentMembership = createAsyncThunk<void, { membershipId: string }, ThunkConfig>(
  "agentMemberships/remove",
  async ({ membershipId }, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId, agentId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId", "agentId"],
    })
    return await services.agentMemberships.remove({
      organizationId,
      projectId,
      agentId,
      membershipId,
    })
  },
)
