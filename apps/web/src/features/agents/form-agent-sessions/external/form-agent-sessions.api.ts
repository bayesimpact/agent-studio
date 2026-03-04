import {
  type AgentSessionMessageDto,
  AgentSessionMessagesRoutes,
  type FormAgentSessionDto,
  FormAgentSessionsRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { FormAgentSession, FormAgentSessionMessage } from "../form-agent-sessions.models"
import type { IFormAgentSessionsSpi } from "../form-agent-sessions.spi"

export default {
  getAll: async ({ organizationId, projectId, agentId, type }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof FormAgentSessionsRoutes.getAll.response>(
      FormAgentSessionsRoutes.getAll.getPath({ organizationId, projectId, agentId }),
      { payload: { type } } satisfies typeof FormAgentSessionsRoutes.getAll.request,
    )
    return response.data.data.map(fromDto)
  },
  createOne: async ({ organizationId, projectId, agentId, type }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof FormAgentSessionsRoutes.createOne.response>(
      FormAgentSessionsRoutes.createOne.getPath({
        organizationId,
        projectId,
        agentId,
      }),
      { payload: { type } } satisfies typeof FormAgentSessionsRoutes.createOne.request,
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
} satisfies IFormAgentSessionsSpi

const fromDto = (dto: FormAgentSessionDto): FormAgentSession => ({
  id: dto.id,
  agentId: dto.agentId,
  type: dto.type,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
  traceUrl: dto.traceUrl,
})

const fromMessagesDto = (dtos: AgentSessionMessageDto[]): FormAgentSessionMessage[] =>
  dtos.map((message) => ({
    ...message,
  }))
