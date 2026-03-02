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
  { agentId: string },
  ThunkConfig
>("extractionAgentSessions/list", async ({ agentId }, { extra: { services }, getState }) => {
  const state = getState()
  const isAdminInterface = selectIsAdminInterface(state)
  const params = getCurrentIds({ state, wantedIds: ["organizationId", "projectId"] })
  return await services.extractionAgentSessions.getAll({
    ...params,
    agentId,
    type: isAdminInterface ? "playground" : "live",
  })
})

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

    return await services.extractionAgentSessions.executeOne({
      organizationId,
      projectId,
      agentId,
      documentId: document.id,
      type: isAdminInterface ? "playground" : "live",
    })
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
  return await services.extractionAgentSessions.getOne({
    organizationId,
    projectId,
    agentId,
    runId: params.runId,
    type: isAdminInterface ? "playground" : "live",
  })
})
