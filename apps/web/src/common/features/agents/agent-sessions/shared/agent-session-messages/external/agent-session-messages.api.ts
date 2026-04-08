import {
  type AgentSessionMessageDto,
  AgentSessionMessagesRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { AgentSessionMessage } from "../agent-session-messages.models"
import type { IAgentSessionMessagesSpi } from "../agent-session-messages.spi"

export default {
  getAll: async ({ organizationId, projectId, agentId, agentSessionId, type }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof AgentSessionMessagesRoutes.listMessages.response>(
      AgentSessionMessagesRoutes.listMessages.getPath({
        organizationId,
        projectId,
        agentId,
        agentSessionId,
      }),
      { payload: { type } } satisfies typeof AgentSessionMessagesRoutes.listMessages.request,
    )
    return fromDto(response.data.data)
  },
} satisfies IAgentSessionMessagesSpi

const fromDto = (dtos: AgentSessionMessageDto[]): AgentSessionMessage[] =>
  dtos.map((message) => ({ ...message }))
