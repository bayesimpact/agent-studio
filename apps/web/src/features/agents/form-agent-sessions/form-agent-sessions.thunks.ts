import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { selectIsAdminInterface } from "../../auth/auth.selectors"
import { getCurrentIds } from "../../helpers"
import type { FormAgentSession } from "./form-agent-sessions.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listFormAgentSessions = createAsyncThunk<
  FormAgentSession[],
  { agentId: string },
  ThunkConfig
>(
  "formAgentSession/listFormAgentSessions",
  async ({ agentId }, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    const isAdminInterface = selectIsAdminInterface(state)
    return services.formAgentSessions.getAll({
      organizationId,
      projectId,
      agentId,
      type: isAdminInterface ? "playground" : "live",
    })
  },
)

export const createFormAgentSession = createAsyncThunk<
  FormAgentSession,
  { agentId: string; onSuccess?: (agentSessionId: string) => void },
  ThunkConfig
>(
  "formAgentSession/createFormAgentSession",
  async ({ agentId }, { extra: { services }, getState }) => {
    const state = getState()
    const isAdminInterface = selectIsAdminInterface(state)
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return services.formAgentSessions.createOne({
      organizationId,
      projectId,
      agentId,
      type: isAdminInterface ? "playground" : "live",
    })
  },
)
