import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { selectIsAdminInterface } from "../auth/auth.selectors"
import { uploadDocument } from "../documents/documents.thunks"
import { getCurrentIds } from "../helpers"
import type {
  AgentExtractionRun,
  AgentExtractionRunSummary,
  ExecuteAgentExtractionResponse,
} from "./agent-extraction-runs.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listAgentExtractionRuns = createAsyncThunk<
  AgentExtractionRunSummary[],
  { agentId: string; playground: boolean },
  ThunkConfig
>(
  "agentExtractionRuns/list",
  async ({ agentId, playground }, { extra: { services }, getState }) => {
    const params = getCurrentIds({ state: getState(), wantedIds: ["organizationId", "projectId"] })
    const payload = { ...params, agentId }
    if (playground) return await services.agentExtractionRuns.getAllPlayground(payload)
    return await services.agentExtractionRuns.getAllLive(payload)
  },
)

export const executeAgentExtractionRun = createAsyncThunk<
  ExecuteAgentExtractionResponse,
  { file: File; promptOverride?: string },
  ThunkConfig
>("agentExtractionRuns/executeOne", async (params, { extra: { services }, getState, dispatch }) => {
  const state = getState()
  const isAdminInterface = selectIsAdminInterface(state)

  const document = await dispatch(
    uploadDocument({
      file: params.file,
      sourceType: "extraction",
    }),
  ).unwrap()

  const { organizationId, projectId, agentId } = getCurrentIds({
    state,
    wantedIds: ["organizationId", "projectId", "agentId"],
  })

  const payload = {
    organizationId,
    projectId,
    agentId,
    documentId: document.id,
    promptOverride: params.promptOverride,
  }

  if (isAdminInterface) {
    return await services.agentExtractionRuns.executePlaygroundOne(payload)
  }
  return await services.agentExtractionRuns.executeLiveOne(payload)
})

export const getAgentExtractionRun = createAsyncThunk<
  AgentExtractionRun,
  { runId: string },
  ThunkConfig
>("agentExtractionRuns/getOne", async (params, { extra: { services }, getState }) => {
  const state = getState()
  const isAdminInterface = selectIsAdminInterface(state)
  const { organizationId, projectId, agentId } = getCurrentIds({
    state,
    wantedIds: ["organizationId", "projectId", "agentId"],
  })
  const payload = {
    organizationId,
    projectId,
    agentId,
    runId: params.runId,
  }
  if (isAdminInterface) {
    return await services.agentExtractionRuns.getOnePlayground(payload)
  }
  return await services.agentExtractionRuns.getOneLive(payload)
})
