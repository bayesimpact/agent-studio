import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { getCurrentIds } from "../../helpers"
import { buildType } from "../shared/base-agent-session/base-agent-sessions.thunks"
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
    const params = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    // NOTE: this is a proxy of listFormAgentSessions because middleware listener causes a bug on messages.
    // TODO: need a dedicated endpoint
    return services.formAgentSessions.getAll({
      ...params,
      agentId,
      type: buildType(),
    })
  },
)
