import { createAsyncThunk } from "@reduxjs/toolkit"
import { getCurrentIds } from "@/features/helpers"
import type { RootState, ThunkExtraArg } from "@/store"
import type { AgentMessageFeedback } from "./agent-message-feedback.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listAgentMessageFeedbacks = createAsyncThunk<
  AgentMessageFeedback[],
  { agentId: string },
  ThunkConfig
>("agentMessageFeedback/list", async (params, { extra: { services }, getState }) => {
  const { organizationId, projectId } = getCurrentIds({
    state: getState(),
    wantedIds: ["organizationId", "projectId"],
  })
  return await services.agentMessageFeedback.getAll({ ...params, organizationId, projectId })
})

export const createAgentMessageFeedback = createAsyncThunk<
  void,
  { agentMessageId: string; content: string },
  ThunkConfig
>(
  "agentMessageFeedback/create",
  async ({ agentMessageId, content }, { extra: { services }, getState }) => {
    const { organizationId, projectId } = getCurrentIds({
      state: getState(),
      wantedIds: ["organizationId", "projectId"],
    })
    await services.agentMessageFeedback.createOne({
      organizationId,
      projectId,
      agentMessageId,
      content,
    })
  },
)
