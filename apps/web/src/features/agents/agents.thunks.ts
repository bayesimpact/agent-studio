import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
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
      Partial<Pick<Agent, "outputJsonSchema">>
    onSuccess?: (agent: Agent) => void
  },
  ThunkConfig
>("agents/create", async (payload, { extra: { services }, getState }) => {
  const { organizationId, projectId } = getCurrentIds({
    state: getState(),
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.agents.createOne(
    { organizationId, projectId },
    {
      name: payload.fields.name,
      defaultPrompt: payload.fields.defaultPrompt,
      model: payload.fields.model,
      temperature: payload.fields.temperature,
      locale: payload.fields.locale,
      outputJsonSchema: payload.fields.outputJsonSchema,
      type: payload.fields.type,
    },
  )
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
    >
  },
  ThunkConfig
>("agents/update", async ({ agentId, fields }, { extra: { services }, getState }) => {
  const { organizationId, projectId } = getCurrentIds({
    state: getState(),
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.agents.updateOne({ organizationId, projectId, agentId }, fields)
})

export const deleteAgent = createAsyncThunk<
  void,
  {
    agentId: string
    onSuccess?: (agentId: string) => void
  },
  ThunkConfig
>("agents/delete", async ({ agentId }, { extra: { services }, getState }) => {
  const { organizationId, projectId } = getCurrentIds({
    state: getState(),
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.agents.deleteOne({ organizationId, projectId, agentId })
})
