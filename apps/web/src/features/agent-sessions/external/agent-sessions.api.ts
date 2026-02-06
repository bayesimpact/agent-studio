import {
  type AgentSessionDto,
  type AgentSessionMessageDto,
  AgentSessionMessagesRoutes,
  AgentSessionsRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { AgentSession, AgentSessionMessage } from "../agent-sessions.models"
import type { IAgentSessionsSpi } from "../agent-sessions.spi"

export default {
  getAllPlayground: async (agentId: string) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AgentSessionsRoutes.getAllPlayground.response>(
      AgentSessionsRoutes.getAllPlayground.getPath({ agentId }),
    )
    return response.data.data.map(fromDto)
  },
  getAllApp: async (agentId: string) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AgentSessionsRoutes.getAllApp.response>(
      AgentSessionsRoutes.getAllApp.getPath({ agentId }),
    )
    return response.data.data.map(fromDto)
  },
  createPlaygroundSession: async (agentId: string) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof AgentSessionsRoutes.createPlaygroundSession.response>(
      AgentSessionsRoutes.createPlaygroundSession.getPath({ agentId }),
    )

    return fromDto(response.data.data)
  },
  createAppSession: async ({ agentId, agentSessionType }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof AgentSessionsRoutes.createAppSession.response>(
      AgentSessionsRoutes.createAppSession.getPath({ agentId }),
      {
        payload: { agentSessionType },
      } satisfies typeof AgentSessionsRoutes.createAppSession.request,
    )
    return fromDto(response.data.data)
  },
  getMessages: async (sessionId: string) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AgentSessionMessagesRoutes.listMessages.response>(
      AgentSessionMessagesRoutes.listMessages.getPath({ sessionId }),
    )

    return fromMessagesDto(response.data.data.messages)
  },
} satisfies IAgentSessionsSpi

const fromDto = (dto: AgentSessionDto): AgentSession => ({
  id: dto.id,
  agentId: dto.agentId,
  type: dto.type,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
})

const fromMessagesDto = (dtos: AgentSessionMessageDto[]): AgentSessionMessage[] =>
  dtos.map((message) => ({
    ...message,
  }))
