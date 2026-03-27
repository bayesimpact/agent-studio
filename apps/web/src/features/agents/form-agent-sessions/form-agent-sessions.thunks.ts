import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { selectIsAdminInterface } from "../../auth/auth.selectors"
import { getCurrentIds } from "../../helpers"
import type { FormAgentSession } from "./form-agent-sessions.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const refreshFormResultForCurrentAgentSession = createAsyncThunk<
  FormAgentSession[],
  { agentId: string },
  ThunkConfig
>(
  "formAgentSession/refreshFormResultForCurrentAgentSession",
  async ({ agentId }, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    const isAdminInterface = selectIsAdminInterface(state)
    // NOTE: this is a proxy of listFormAgentSessions because middleware listener causes a bug on messages.
    // TODO: need a dedicated endpoint
    return services.formAgentSessions.getAll({
      organizationId,
      projectId,
      agentId,
      type: isAdminInterface ? "playground" : "live",
    })
  },
)

export const listFormAgentSessionsForAgents = createAsyncThunk<
  { [agentId: string]: FormAgentSession[] }[],
  { agentIds: string[] },
  ThunkConfig
>(
  "formAgentSession/listFormAgentSessionsForAgents",
  async ({ agentIds }, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    const isAdminInterface = selectIsAdminInterface(state)
    return Promise.all(
      agentIds.map(async (agentId) => {
        return {
          [agentId]: await services.formAgentSessions.getAll({
            organizationId,
            projectId,
            agentId,
            type: isAdminInterface ? "playground" : "live",
          }),
        }
      }),
    )
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
