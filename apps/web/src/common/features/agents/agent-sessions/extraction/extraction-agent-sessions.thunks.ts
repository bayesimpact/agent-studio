import { createAsyncThunk } from "@reduxjs/toolkit"
import { getCurrentIds } from "@/common/features/helpers"
import type { RootState, ThunkExtraArg } from "@/common/store"
import { uploadDocument } from "@/studio/features/documents/documents.thunks"
import { isStudioInterface } from "@/studio/routes/helpers"
import type {
  ExtractionAgentSession,
  ExtractionAgentSessionResult,
} from "./extraction-agent-sessions.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

// FIXME:

export const executeExtractionAgentSession = createAsyncThunk<
  ExtractionAgentSessionResult,
  { file: File },
  ThunkConfig
>(
  "extractionAgentSessions/executeOne",
  async (params, { extra: { services }, getState, dispatch }) => {
    const state = getState()
    const isStudio = isStudioInterface()

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
      type: isStudio ? "playground" : "live",
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
    const isStudio = isStudioInterface()
    const params = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId", "agentId"],
    })
    return await services.extractionAgentSessions.getOne({
      ...params,
      agentSessionId,
      type: isStudio ? "playground" : "live",
    })
  },
)
