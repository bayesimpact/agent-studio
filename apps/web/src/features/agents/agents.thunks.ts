import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { Agent } from "./agents.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listAgents = createAsyncThunk<Agent[], { projectId: string }, ThunkConfig>(
  "agents/list",
  async (params, { extra: { services } }) => await services.agents.getAll(params),
)

export const createAgent = createAsyncThunk<
  Agent,
  {
    projectId: string
    fields: Pick<Agent, "name" | "defaultPrompt" | "model" | "temperature" | "locale">
    onSuccess?: (agentId: string) => void
  },
  ThunkConfig
>(
  "agents/create",
  async (payload, { extra: { services } }) =>
    await services.agents.createOne(
      { projectId: payload.projectId },
      {
        name: payload.fields.name,
        defaultPrompt: payload.fields.defaultPrompt,
        model: payload.fields.model,
        temperature: payload.fields.temperature,
        locale: payload.fields.locale,
      },
    ),
)

export const updateAgent = createAsyncThunk<
  void,
  {
    agentId: string
    projectId: string
    fields: Partial<Pick<Agent, "name" | "defaultPrompt" | "model" | "temperature" | "locale">>
  },
  ThunkConfig
>(
  "agents/update",
  async ({ agentId, projectId, fields }, { extra: { services } }) =>
    await services.agents.updateOne({ agentId, projectId }, fields),
)

export const deleteAgent = createAsyncThunk<
  void,
  { agentId: string; projectId: string; onSuccess?: (agentId: string) => void },
  ThunkConfig
>(
  "agents/delete",
  async ({ agentId, projectId }, { extra: { services } }) =>
    await services.agents.deleteOne({ agentId, projectId }),
)
