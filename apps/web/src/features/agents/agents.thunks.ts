import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { DocumentTagsUpdateFields } from "../document-tags/document-tags.models"
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
  {
    fields: Pick<Agent, "name" | "defaultPrompt" | "model" | "temperature" | "locale" | "type"> &
      Partial<Pick<Agent, "outputJsonSchema">> &
      DocumentTagsUpdateFields
    onSuccess?: (agent: Agent) => void
  },
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
  {
    agentId: string
    fields: Partial<
      Pick<
        Agent,
        "name" | "defaultPrompt" | "model" | "temperature" | "locale" | "type" | "outputJsonSchema"
      >
    > &
      DocumentTagsUpdateFields
  },
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
  {
    agentId: string
    onSuccess?: (agentId: string) => void
  },
  ThunkConfig
>("agents/delete", async ({ agentId }, { extra: { services }, getState }) => {
  const params = getCurrentIds({
    state: getState(),
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.agents.deleteOne({ ...params, agentId })
})
