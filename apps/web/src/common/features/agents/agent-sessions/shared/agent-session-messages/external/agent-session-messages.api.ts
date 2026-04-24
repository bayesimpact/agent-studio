import {
  type AgentSessionMessageDto,
  AgentSessionMessagesRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { AgentSessionMessage } from "../agent-session-messages.models"
import type { IAgentSessionMessagesSpi } from "../agent-session-messages.spi"

export default {
  getAll: async ({ payload, ...params }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof AgentSessionMessagesRoutes.getAll.response>(
      AgentSessionMessagesRoutes.getAll.getPath(params),
      { payload } satisfies typeof AgentSessionMessagesRoutes.getAll.request,
    )
    return response.data.data.map(fromDto)
  },
  getOne: async ({ payload, ...params }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof AgentSessionMessagesRoutes.getOne.response>(
      AgentSessionMessagesRoutes.getOne.getPath(params),
      { payload } satisfies typeof AgentSessionMessagesRoutes.getOne.request,
    )
    return fromDto(response.data.data)
  },
} satisfies IAgentSessionMessagesSpi

const fromDto = (dto: AgentSessionMessageDto): AgentSessionMessage => ({
  id: dto.id,
  role: dto.role,
  content: dto.content,
  createdAt: dto.createdAt,
  documentId: dto.documentId,
  status: dto.status,
  startedAt: dto.startedAt,
  completedAt: dto.completedAt,
  toolCalls: dto.toolCalls,
})
