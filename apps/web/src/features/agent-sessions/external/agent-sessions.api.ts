import {
  type AgentSessionDto,
  type AgentSessionMessageDto,
  AgentSessionMessagesRoutes,
  ConversationAgentSessionsRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { AgentSession, AgentSessionMessage } from "../agent-sessions.models"
import type { IAgentSessionsSpi } from "../agent-sessions.spi"

export default {
  getAllPlaygroundSessions: async ({
    organizationId,
    projectId,
    agentId,
  }: {
    organizationId: string
    projectId: string
    agentId: string
  }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<
      typeof ConversationAgentSessionsRoutes.getAllPlaygroundSessions.response
    >(
      ConversationAgentSessionsRoutes.getAllPlaygroundSessions.getPath({
        organizationId,
        projectId,
        agentId,
      }),
    )
    return response.data.data.map(fromDto)
  },
  getAllAppSessions: async ({
    organizationId,
    projectId,
    agentId,
  }: {
    organizationId: string
    projectId: string
    agentId: string
  }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<
      typeof ConversationAgentSessionsRoutes.getAllAppSessions.response
    >(
      ConversationAgentSessionsRoutes.getAllAppSessions.getPath({
        organizationId,
        projectId,
        agentId,
      }),
    )
    return response.data.data.map(fromDto)
  },
  createPlaygroundSession: async ({
    organizationId,
    projectId,
    agentId,
  }: {
    organizationId: string
    projectId: string
    agentId: string
  }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<
      typeof ConversationAgentSessionsRoutes.createPlaygroundSession.response
    >(
      ConversationAgentSessionsRoutes.createPlaygroundSession.getPath({
        organizationId,
        projectId,
        agentId,
      }),
    )

    return fromDto(response.data.data)
  },
  createAppSession: async ({
    organizationId,
    projectId,
    agentId,
    agentSessionType,
  }: {
    organizationId: string
    projectId: string
    agentId: string
    agentSessionType: "app-private"
  }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<
      typeof ConversationAgentSessionsRoutes.createAppSession.response
    >(
      ConversationAgentSessionsRoutes.createAppSession.getPath({
        organizationId,
        projectId,
        agentId,
      }),
      {
        payload: { agentSessionType },
      } satisfies typeof ConversationAgentSessionsRoutes.createAppSession.request,
    )
    return fromDto(response.data.data)
  },
  getMessages: async ({
    organizationId,
    projectId,
    agentId,
    agentSessionId,
  }: {
    organizationId: string
    projectId: string
    agentId: string
    agentSessionId: string
  }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AgentSessionMessagesRoutes.listMessages.response>(
      AgentSessionMessagesRoutes.listMessages.getPath({
        organizationId,
        projectId,
        agentId,
        agentSessionId,
      }),
    )

    return fromMessagesDto(response.data.data)
  },
} satisfies IAgentSessionsSpi

const fromDto = (dto: AgentSessionDto): AgentSession => ({
  id: dto.id,
  agentId: dto.agentId,
  type: dto.type,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
  traceUrl: dto.traceUrl,
})

const fromMessagesDto = (dtos: AgentSessionMessageDto[]): AgentSessionMessage[] =>
  dtos.map((message) => ({
    ...message,
  }))
