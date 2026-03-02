import {
  type AgentSessionMessageDto,
  AgentSessionMessagesRoutes,
  type ConversationAgentSessionDto,
  ConversationAgentSessionsRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type {
  ConversationAgentSession,
  ConversationAgentSessionMessage,
} from "../conversation-agent-sessions.models"
import type { IConversationAgentSessionsSpi } from "../conversation-agent-sessions.spi"

export default {
  getAll: async ({ organizationId, projectId, agentId, type }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ConversationAgentSessionsRoutes.getAll.response>(
      ConversationAgentSessionsRoutes.getAll.getPath({ organizationId, projectId, agentId }),
      { payload: { type } } satisfies typeof ConversationAgentSessionsRoutes.getAll.request,
    )
    return response.data.data.map(fromDto)
  },
  createOne: async ({ organizationId, projectId, agentId, type }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ConversationAgentSessionsRoutes.createOne.response>(
      ConversationAgentSessionsRoutes.createOne.getPath({
        organizationId,
        projectId,
        agentId,
      }),
      { payload: { type } } satisfies typeof ConversationAgentSessionsRoutes.createOne.request,
    )

    return fromDto(response.data.data)
  },
  getMessages: async ({ organizationId, projectId, agentId, agentSessionId, type }) => {
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

    return fromMessagesDto(response.data.data)
  },
} satisfies IConversationAgentSessionsSpi

const fromDto = (dto: ConversationAgentSessionDto): ConversationAgentSession => ({
  id: dto.id,
  agentId: dto.agentId,
  type: dto.type,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
  traceUrl: dto.traceUrl,
})

const fromMessagesDto = (dtos: AgentSessionMessageDto[]): ConversationAgentSessionMessage[] =>
  dtos.map((message) => ({
    ...message,
  }))
