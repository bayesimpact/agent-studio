import { createAsyncThunk } from "@reduxjs/toolkit"
import { getCurrentIds } from "@/common/features/helpers"
import type { RootState, ThunkExtraArg } from "@/common/store"
import type { AgentMembership } from "./agent-memberships.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

const list = createAsyncThunk<AgentMembership[], void, ThunkConfig>(
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

const invite = createAsyncThunk<AgentMembership[], { emails: string[] }, ThunkConfig>(
  "agentMemberships/invite",
  async ({ emails }, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId, agentId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId", "agentId"],
    })
    return await services.agentMemberships.invite({ organizationId, projectId, agentId, emails })
  },
)

const remove = createAsyncThunk<void, { membershipId: string }, ThunkConfig>(
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

export const agentMembershipsThunks = { list, invite, remove }
