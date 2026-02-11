import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { AgentMessageFeedback } from "./agent-message-feedback.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listAgentMessageFeedbacks = createAsyncThunk<
  AgentMessageFeedback[],
  { organizationId: string; projectId: string; agentId: string },
  ThunkConfig
>(
  "agentMessageFeedback/list",
  async (params, { extra: { services } }) => await services.agentMessageFeedback.getAll(params),
)

export const createAgentMessageFeedback = createAsyncThunk<
  void,
  {
    organizationId: string
    projectId: string
    agentMessageId: string
    content: string
  },
  ThunkConfig
>(
  "agentMessageFeedback/create",
  async ({ organizationId, projectId, agentMessageId, content }, { extra: { services } }) => {
    await services.agentMessageFeedback.createOne({
      organizationId,
      projectId,
      agentMessageId,
      content,
    })
  },
)
