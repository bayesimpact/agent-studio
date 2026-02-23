import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { AgentExtractionRunSummary } from "./agent-extraction-runs.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listAgentExtractionRuns = createAsyncThunk<
  AgentExtractionRunSummary[],
  {
    organizationId: string
    projectId: string
    agentId: string
  },
  ThunkConfig
>(
  "agentExtractionRuns/list",
  async (params, { extra: { services } }) => await services.agentExtractionRuns.getAll(params),
)
