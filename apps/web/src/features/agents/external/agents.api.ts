import { type AgentDto, AgentsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { Agent } from "../agents.models"
import type { IAgentsSpi } from "../agents.spi"

export default {
  getAll: async ({ organizationId, projectId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AgentsRoutes.getAll.response>(
      AgentsRoutes.getAll.getPath({ organizationId, projectId }),
    )
    return response.data.data.agents.map(fromDto)
  },
  createOne: async ({ organizationId, projectId }, payload) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof AgentsRoutes.createOne.response>(
      AgentsRoutes.createOne.getPath({ organizationId, projectId }),
      { payload: toCreateDto(payload) },
    )
    return fromDto(response.data.data)
  },
  updateOne: async ({ organizationId, projectId, agentId }, payload) => {
    const axios = getAxiosInstance()
    await axios.patch(AgentsRoutes.updateOne.getPath({ organizationId, projectId, agentId }), {
      payload: toUpdateDto(payload),
    })
  },
  deleteOne: async ({ organizationId, projectId, agentId }) => {
    const axios = getAxiosInstance()
    await axios.delete(AgentsRoutes.deleteOne.getPath({ organizationId, projectId, agentId }))
  },
} satisfies IAgentsSpi

const toCreateDto = (
  payload: Pick<Agent, "name" | "defaultPrompt" | "model" | "locale" | "temperature">,
): (typeof AgentsRoutes.createOne.request)["payload"] => ({
  defaultPrompt: payload.defaultPrompt,
  locale: payload.locale,
  model: payload.model,
  name: payload.name,
  temperature: payload.temperature,
})

const toUpdateDto = (
  payload: Partial<Pick<Agent, "name" | "defaultPrompt" | "locale" | "model" | "temperature">>,
): (typeof AgentsRoutes.updateOne.request)["payload"] => ({
  defaultPrompt: payload.defaultPrompt,
  locale: payload.locale,
  model: payload.model,
  name: payload.name,
  temperature: payload.temperature,
})

const fromDto = (dto: AgentDto): Agent => ({
  createdAt: dto.createdAt,
  defaultPrompt: dto.defaultPrompt,
  id: dto.id,
  locale: dto.locale,
  model: dto.model,
  name: dto.name,
  projectId: dto.projectId,
  temperature: dto.temperature,
  updatedAt: dto.updatedAt,
})
