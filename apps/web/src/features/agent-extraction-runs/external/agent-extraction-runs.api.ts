import { AgentExtractionRunsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { IAgentExtractionRunsSpi } from "../agent-extraction-runs.spi"

const api: IAgentExtractionRunsSpi = {
  getAll: async ({ organizationId, projectId, agentId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AgentExtractionRunsRoutes.getAll.response>(
      AgentExtractionRunsRoutes.getAll.getPath({ organizationId, projectId, agentId }),
    )
    return response.data.data.runs
  },
}

export default api
