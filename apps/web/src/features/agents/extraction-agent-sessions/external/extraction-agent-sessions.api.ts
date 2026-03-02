import {
  type ExtractionAgentSessionDto,
  type ExtractionAgentSessionResultDto,
  type ExtractionAgentSessionSummaryDto,
  ExtractionAgentSessionsRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type {
  ExtractionAgentSession,
  ExtractionAgentSessionResult,
  ExtractionAgentSessionSummary,
} from "../extraction-agent-sessions.models"
import type { IExtractionAgentSessionsSpi } from "../extraction-agent-sessions.spi"

const api: IExtractionAgentSessionsSpi = {
  getAllPlayground: async ({ organizationId, projectId, agentId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<
      typeof ExtractionAgentSessionsRoutes.getAllPlayground.response
    >(
      ExtractionAgentSessionsRoutes.getAllPlayground.getPath({
        organizationId,
        projectId,
        agentId,
      }),
    )
    return response.data.data.map(fromExtractionAgentSessionSummaryDto)
  },
  getAllLive: async ({ organizationId, projectId, agentId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ExtractionAgentSessionsRoutes.getAllLive.response>(
      ExtractionAgentSessionsRoutes.getAllLive.getPath({ organizationId, projectId, agentId }),
    )
    return response.data.data.map(fromExtractionAgentSessionSummaryDto)
  },
  getOnePlayground: async ({ organizationId, projectId, agentId, runId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<
      typeof ExtractionAgentSessionsRoutes.getOnePlayground.response
    >(
      ExtractionAgentSessionsRoutes.getOnePlayground.getPath({
        organizationId,
        projectId,
        agentId,
        runId,
      }),
    )
    return fromExtractionAgentSessionDto(response.data.data)
  },
  getOneLive: async ({ organizationId, projectId, agentId, runId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ExtractionAgentSessionsRoutes.getOneLive.response>(
      ExtractionAgentSessionsRoutes.getOneLive.getPath({
        organizationId,
        projectId,
        agentId,
        runId,
      }),
    )
    return fromExtractionAgentSessionDto(response.data.data)
  },
  executePlaygroundOne: async ({ organizationId, projectId, agentId, documentId }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<
      typeof ExtractionAgentSessionsRoutes.executePlaygroundOne.response
    >(
      ExtractionAgentSessionsRoutes.executePlaygroundOne.getPath({
        organizationId,
        projectId,
        agentId,
      }),
      { payload: { documentId } },
    )
    return fromExtractionAgentSessionResultDto(response.data.data)
  },
  executeLiveOne: async ({ organizationId, projectId, agentId, documentId }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ExtractionAgentSessionsRoutes.executeLiveOne.response>(
      ExtractionAgentSessionsRoutes.executeLiveOne.getPath({ organizationId, projectId, agentId }),
      { payload: { documentId } },
    )
    return fromExtractionAgentSessionResultDto(response.data.data)
  },
}

export default api

function fromExtractionAgentSessionDto(dto: ExtractionAgentSessionDto): ExtractionAgentSession {
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

function fromExtractionAgentSessionSummaryDto(
  dto: ExtractionAgentSessionSummaryDto,
): ExtractionAgentSessionSummary {
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

function fromExtractionAgentSessionResultDto(
  dto: ExtractionAgentSessionResultDto,
): ExtractionAgentSessionResult {
  return {
    runId: dto.runId,
    result: dto.result,
  }
}
