import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type {
  AgentExtractionRun,
  AgentExtractionRunSummary,
  ExecuteAgentExtractionResponse,
} from "./agent-extraction-runs.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listAgentExtractionRuns = createAsyncThunk<
  AgentExtractionRunSummary[],
  {
    organizationId: string
    projectId: string
    agentId: string
    type: "playground" | "live"
  },
  ThunkConfig
>("agentExtractionRuns/list", async (params, { extra: { services } }) => {
  if (params.type === "playground") {
    return await services.agentExtractionRuns.getAllPlayground(params)
  }

  return await services.agentExtractionRuns.getAllLive(params)
})

export const executeAgentExtractionRun = createAsyncThunk<
  ExecuteAgentExtractionResponse,
  {
    organizationId: string
    projectId: string
    agentId: string
    documentId: string
    type: "playground" | "live"
    promptOverride?: string
  },
  ThunkConfig
>("agentExtractionRuns/executeOne", async (params, { extra: { services } }) => {
  if (params.type === "playground") {
    return await services.agentExtractionRuns.executePlaygroundOne(params)
  }

  return await services.agentExtractionRuns.executeLiveOne(params)
})

export const getAgentExtractionRun = createAsyncThunk<
  AgentExtractionRun,
  {
    organizationId: string
    projectId: string
    agentId: string
    runId: string
    type: "playground" | "live"
  },
  ThunkConfig
>("agentExtractionRuns/getOne", async (params, { extra: { services } }) => {
  if (params.type === "playground") {
    return await services.agentExtractionRuns.getOnePlayground(params)
  }

  return await services.agentExtractionRuns.getOneLive(params)
})
