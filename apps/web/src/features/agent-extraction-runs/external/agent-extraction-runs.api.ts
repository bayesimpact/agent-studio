import {
  type AgentExtractionResultDto,
  type AgentExtractionRunDto,
  type AgentExtractionRunSummaryDto,
  AgentExtractionRunsRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type {
  AgentExtractionResult,
  AgentExtractionRun,
  AgentExtractionRunSummary,
} from "../agent-extraction-runs.models"
import type { IAgentExtractionRunsSpi } from "../agent-extraction-runs.spi"

const api: IAgentExtractionRunsSpi = {
  getAllPlayground: async ({ organizationId, projectId, agentId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AgentExtractionRunsRoutes.getAllPlayground.response>(
      AgentExtractionRunsRoutes.getAllPlayground.getPath({ organizationId, projectId, agentId }),
    )
    return response.data.data.map(fromAgentExtractionRunSummaryDto)
  },
  getAllLive: async ({ organizationId, projectId, agentId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AgentExtractionRunsRoutes.getAllLive.response>(
      AgentExtractionRunsRoutes.getAllLive.getPath({ organizationId, projectId, agentId }),
    )
    return response.data.data.map(fromAgentExtractionRunSummaryDto)
  },
  getOnePlayground: async ({ organizationId, projectId, agentId, runId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AgentExtractionRunsRoutes.getOnePlayground.response>(
      AgentExtractionRunsRoutes.getOnePlayground.getPath({
        organizationId,
        projectId,
        agentId,
        runId,
      }),
    )
    return fromAgentExtractionRunDto(response.data.data)
  },
  getOneLive: async ({ organizationId, projectId, agentId, runId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AgentExtractionRunsRoutes.getOneLive.response>(
      AgentExtractionRunsRoutes.getOneLive.getPath({ organizationId, projectId, agentId, runId }),
    )
    return fromAgentExtractionRunDto(response.data.data)
  },
  executePlaygroundOne: async ({ organizationId, projectId, agentId, documentId }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<
      typeof AgentExtractionRunsRoutes.executePlaygroundOne.response
    >(
      AgentExtractionRunsRoutes.executePlaygroundOne.getPath({
        organizationId,
        projectId,
        agentId,
      }),
      { payload: { documentId } },
    )
    return fromAgentExtractionResultDto(response.data.data)
  },
  executeLiveOne: async ({ organizationId, projectId, agentId, documentId }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof AgentExtractionRunsRoutes.executeLiveOne.response>(
      AgentExtractionRunsRoutes.executeLiveOne.getPath({ organizationId, projectId, agentId }),
      { payload: { documentId } },
    )
    return fromAgentExtractionResultDto(response.data.data)
  },
}

export default api

function fromAgentExtractionRunDto(dto: AgentExtractionRunDto): AgentExtractionRun {
  return {
    id: dto.id,
    agentId: dto.agentId,
    documentId: dto.documentId,
    documentFileName: dto.documentFileName,
    traceUrl: dto.traceUrl,
    type: dto.type,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    result: dto.result,
    errorCode: dto.errorCode,
    errorDetails: dto.errorDetails,
  }
}

function fromAgentExtractionRunSummaryDto(
  dto: AgentExtractionRunSummaryDto,
): AgentExtractionRunSummary {
  return {
    id: dto.id,
    agentId: dto.agentId,
    documentId: dto.documentId,
    documentFileName: dto.documentFileName,
    traceUrl: dto.traceUrl,
    type: dto.type,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

function fromAgentExtractionResultDto(dto: AgentExtractionResultDto): AgentExtractionResult {
  return {
    runId: dto.runId,
    result: dto.result,
  }
}
