import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { selectIsAdminInterface } from "../../auth/auth.selectors"
import { uploadDocument } from "../../documents/documents.thunks"
import { getCurrentIds } from "../../helpers"
import type {
  ExtractionAgentSession,
  ExtractionAgentSessionResult,
  ExtractionAgentSessionSummary,
} from "./extraction-agent-sessions.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listExtractionAgentSessions = createAsyncThunk<
  ExtractionAgentSessionSummary[],
  { agentId: string; playground: boolean },
  ThunkConfig
>(
  "extractionAgentSessions/list",
  async ({ agentId, playground }, { extra: { services }, getState }) => {
    const params = getCurrentIds({ state: getState(), wantedIds: ["organizationId", "projectId"] })
    const payload = { ...params, agentId }
    if (playground) return await services.extractionAgentSessions.getAllPlayground(payload)
    return await services.extractionAgentSessions.getAllLive(payload)
  },
)

export const executeExtractionAgentSession = createAsyncThunk<
  ExtractionAgentSessionResult,
  { file: File },
  ThunkConfig
>(
  "extractionAgentSessions/executeOne",
  async (params, { extra: { services }, getState, dispatch }) => {
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
    }

    if (isAdminInterface) {
      return await services.extractionAgentSessions.executePlaygroundOne(payload)
    }
    return await services.extractionAgentSessions.executeLiveOne(payload)
  },
)

export const getExtractionAgentSession = createAsyncThunk<
  ExtractionAgentSession,
  { runId: string },
  ThunkConfig
>("extractionAgentSessions/getOne", async (params, { extra: { services }, getState }) => {
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
    return await services.extractionAgentSessions.getOnePlayground(payload)
  }
  return await services.extractionAgentSessions.getOneLive(payload)
})
