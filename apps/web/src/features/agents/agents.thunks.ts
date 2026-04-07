import type { CreateAgentDto, UpdateAgentDto } from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/common/store"
import { getCurrentIds } from "../helpers"
import type { Agent } from "./agents.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listAgents = createAsyncThunk<Agent[], void, ThunkConfig>(
  "agents/list",
  async (_, { extra: { services }, getState }) => {
    const params = getCurrentIds({ state: getState(), wantedIds: ["organizationId", "projectId"] })
    return await services.agents.getAll(params)
  },
)

export const createAgent = createAsyncThunk<
  Agent,
  { fields: CreateAgentDto; onSuccess?: (agent: Agent) => void },
  ThunkConfig
>("agents/create", async ({ fields }, { extra: { services }, getState }) => {
  const params = getCurrentIds({
    state: getState(),
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.agents.createOne(params, fields)
})

export const updateAgent = createAsyncThunk<
  void,
  { agentId: string; fields: UpdateAgentDto },
  ThunkConfig
>("agents/update", async ({ agentId, fields }, { extra: { services }, getState }) => {
  const params = getCurrentIds({
    state: getState(),
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.agents.updateOne({ ...params, agentId }, fields)
})

export const deleteAgent = createAsyncThunk<
  void,
  { agentId: string; onSuccess?: (agentId: string) => void },
  ThunkConfig
>("agents/delete", async ({ agentId }, { extra: { services }, getState }) => {
  const params = getCurrentIds({
    state: getState(),
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.agents.deleteOne({ ...params, agentId })
})
