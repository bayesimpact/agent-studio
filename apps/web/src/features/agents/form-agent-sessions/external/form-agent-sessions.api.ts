import { type FormAgentSessionDto, FormAgentSessionsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { FormAgentSession } from "../form-agent-sessions.models"
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
} satisfies IFormAgentSessionsSpi

const fromDto = (dto: FormAgentSessionDto): FormAgentSession => ({
  agentId: dto.agentId,
  createdAt: dto.createdAt,
  id: dto.id,
  result: dto.result,
  traceUrl: dto.traceUrl,
  type: dto.type,
  updatedAt: dto.updatedAt,
})
