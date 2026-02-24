import { AgentExtractionRunsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { IAgentExtractionRunsSpi } from "../agent-extraction-runs.spi"

const api: IAgentExtractionRunsSpi = {
  getAllPlayground: async ({ organizationId, projectId, agentId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AgentExtractionRunsRoutes.getAllPlayground.response>(
      AgentExtractionRunsRoutes.getAllPlayground.getPath({ organizationId, projectId, agentId }),
    )
    return response.data.data.runs
  },
  getAllLive: async ({ organizationId, projectId, agentId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AgentExtractionRunsRoutes.getAllLive.response>(
      AgentExtractionRunsRoutes.getAllLive.getPath({ organizationId, projectId, agentId }),
    )
    return response.data.data.runs
  },
  executePlaygroundOne: async ({
    organizationId,
    projectId,
    agentId,
    documentId,
    promptOverride,
  }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<
      typeof AgentExtractionRunsRoutes.executePlaygroundOne.response
    >(
      AgentExtractionRunsRoutes.executePlaygroundOne.getPath({
        organizationId,
        projectId,
        agentId,
      }),
      {
        payload: {
          documentId,
          promptOverride,
        },
      },
    )
    return response.data.data
  },
  executeLiveOne: async ({ organizationId, projectId, agentId, documentId, promptOverride }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof AgentExtractionRunsRoutes.executeLiveOne.response>(
      AgentExtractionRunsRoutes.executeLiveOne.getPath({ organizationId, projectId, agentId }),
      {
        payload: {
          documentId,
          promptOverride,
        },
      },
    )
    return response.data.data
  },
}

export default api
