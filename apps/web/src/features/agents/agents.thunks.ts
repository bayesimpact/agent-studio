import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { Agent } from "./agents.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listAgents = createAsyncThunk<
  Agent[],
  { organizationId: string; projectId: string },
  ThunkConfig
>("agents/list", async (params, { extra: { services } }) => await services.agents.getAll(params))

export const createAgent = createAsyncThunk<
  Agent,
  {
    organizationId: string
    projectId: string
    fields: Pick<Agent, "name" | "defaultPrompt" | "model" | "temperature" | "locale" | "type"> &
      Partial<Pick<Agent, "outputJsonSchema">>
    onSuccess?: (agent: Agent) => void
  },
  ThunkConfig
>(
  "agents/create",
  async (payload, { extra: { services } }) =>
    await services.agents.createOne(
      { organizationId: payload.organizationId, projectId: payload.projectId },
      {
        name: payload.fields.name,
        defaultPrompt: payload.fields.defaultPrompt,
        model: payload.fields.model,
        temperature: payload.fields.temperature,
        locale: payload.fields.locale,
        outputJsonSchema: payload.fields.outputJsonSchema,
        type: payload.fields.type,
      },
    ),
)

export const updateAgent = createAsyncThunk<
  void,
  {
    organizationId: string
    projectId: string
    agentId: string
    fields: Partial<
      Pick<
        Agent,
        "name" | "defaultPrompt" | "model" | "temperature" | "locale" | "type" | "outputJsonSchema"
      >
    >
  },
  ThunkConfig
>(
  "agents/update",
  async ({ organizationId, projectId, agentId, fields }, { extra: { services } }) =>
    await services.agents.updateOne({ organizationId, projectId, agentId }, fields),
)

export const deleteAgent = createAsyncThunk<
  void,
  {
    organizationId: string
    projectId: string
    agentId: string
    onSuccess?: (agentId: string) => void
  },
  ThunkConfig
>(
  "agents/delete",
  async ({ organizationId, projectId, agentId }, { extra: { services } }) =>
    await services.agents.deleteOne({ organizationId, projectId, agentId }),
)
