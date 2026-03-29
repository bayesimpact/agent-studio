import type { SuccessResponseDTO } from "@caseai-connect/api-contracts"
import { createAsyncThunk, type ListenerEffectAPI } from "@reduxjs/toolkit"
import { selectIsAdminInterface } from "@/features/auth/auth.selectors"
import { getCurrentIds } from "@/features/helpers"
import type { AppDispatch, RootState, ThunkExtraArg } from "@/store"
import type { Agent } from "../../agents.models"
import type { ConversationAgentSession } from "../../conversation-agent-sessions/conversation-agent-sessions.models"
import type { ExtractionAgentSession } from "../../extraction-agent-sessions/extraction-agent-sessions.models"
import type { FormAgentSession } from "../../form-agent-sessions/form-agent-sessions.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

type BaseAgentSession = FormAgentSession | ConversationAgentSession | ExtractionAgentSession

export const listAgentSessionsForAgents = createAsyncThunk<
  { [agentId: string]: BaseAgentSession[] }[],
  { agentType: Agent["type"]; agentIds: string[] },
  ThunkConfig
>(
  "agentSession/listAgentSessionsForAgents",
  async ({ agentType, agentIds }, { extra: { services }, getState }) => {
    const map = {
      form: services.formAgentSessions,
      conversation: services.conversationAgentSessions,
      extraction: services.extractionAgentSessions,
    }
    const state = getState()
    const params = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return Promise.all(
      agentIds.map(async (agentId) => {
        return {
          [agentId]: await map[agentType].getAll({
            ...params,
            agentId,
            type: buildType(state),
          }),
        }
      }),
    )
  },
)

export const createAgentSession = createAsyncThunk<
  BaseAgentSession,
  { agentType: Agent["type"]; agentId: string; onSuccess?: (agentSessionId: string) => void },
  ThunkConfig
>(
  "formAgentSession/createFormAgentSession",
  async ({ agentType, agentId }, { extra: { services }, getState }) => {
    if (agentType === "extraction") {
      throw new Error("Creation of extraction agent session is not supported yet")
    }

    const map = {
      form: services.formAgentSessions,
      conversation: services.conversationAgentSessions,
      extraction: services.extractionAgentSessions,
    }
    const state = getState()
    const params = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return map[agentType].createOne({
      ...params,
      agentId,
      type: buildType(state),
    })
  },
)

export const deleteAgentSession = createAsyncThunk<
  SuccessResponseDTO,
  { agentType: Agent["type"]; agentId: string; agentSessionId: string; onSuccess?: () => void },
  ThunkConfig
>(
  "agentSession/deleteAgentSession",
  async ({ agentType, agentId, agentSessionId }, { extra: { services }, getState }) => {
    const map = {
      form: services.formAgentSessions,
      conversation: services.conversationAgentSessions,
      extraction: services.extractionAgentSessions,
    }
    const state = getState()
    const params = getCurrentIds({
      state,
      wantedIds: ["organizationId", "projectId"],
    })
    return map[agentType].deleteOne({
      ...params,
      agentId,
      agentSessionId,
      type: buildType(state),
    })
  },
)

export function buildType(state: RootState) {
  return selectIsAdminInterface(state) ? "playground" : "live"
}

export async function loadAgentSessionsForAllAgents({
  agentType,
  agents,
  listenerApi,
}: {
  agentType: Agent["type"]
  agents: Agent[]
  listenerApi: ListenerEffectAPI<RootState, AppDispatch, unknown>
}) {
  await listenerApi.dispatch(
    listAgentSessionsForAgents({
      agentType,
      agentIds: Object.values(agents)
        .flat()
        .filter((agent) => agent.type === agentType)
        .map((agent) => agent.id),
    }),
  )
}
