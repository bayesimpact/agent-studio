import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import { selectIsAdminInterface } from "../../auth/auth.selectors"
import { getCurrentIds } from "../../helpers"
import type { ConversationAgentSession } from "./conversation-agent-sessions.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listConversationAgentSessionsForAgents = createAsyncThunk<
  { [agentId: string]: ConversationAgentSession[] }[],
  { agentIds: string[] },
  ThunkConfig
>(
  "conversationAgentSession/listConversationAgentSessionsForAgents",
  async ({ agentIds }, { extra: { services }, getState }) => {
    const state = getState()
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    const isAdminInterface = selectIsAdminInterface(state)
    return await Promise.all(
      agentIds.map(async (agentId) => {
        return {
          [agentId]: await services.conversationAgentSessions.getAll({
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

export const createConversationAgentSession = createAsyncThunk<
  ConversationAgentSession,
  { agentId: string; onSuccess?: (agentSessionId: string) => void },
  ThunkConfig
>(
  "conversationAgentSession/createConversationAgentSession",
  async ({ agentId }, { extra: { services }, getState }) => {
    const state = getState()
    const isAdminInterface = selectIsAdminInterface(state)
    const { organizationId, projectId } = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return services.conversationAgentSessions.createOne({
      organizationId,
      projectId,
      agentId,
      type: isAdminInterface ? "playground" : "live",
    })
  },
)
