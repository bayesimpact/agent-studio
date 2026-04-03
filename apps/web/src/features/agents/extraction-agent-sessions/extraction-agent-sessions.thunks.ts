import { createAsyncThunk } from "@reduxjs/toolkit"
import { selectIsAdminInterface } from "@/features/auth/auth.selectors"
import { getCurrentIds } from "@/features/helpers"
import type { RootState, ThunkExtraArg } from "@/store"
import { uploadDocument } from "@/studio/features/documents/documents.thunks"
import type {
  ExtractionAgentSession,
  ExtractionAgentSessionResult,
} from "./extraction-agent-sessions.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

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
  { agentSessionId: string },
  ThunkConfig
>(
  "extractionAgentSessions/getOne",
  async ({ agentSessionId }, { extra: { services }, getState }) => {
    const state = getState()
    const isAdminInterface = selectIsAdminInterface(state)
    const params = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId", "agentId"],
    })
    return await services.extractionAgentSessions.getOne({
      ...params,
      agentSessionId,
      type: isAdminInterface ? "playground" : "live",
    })
  },
)
