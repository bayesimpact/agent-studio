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
  getAll: async ({ organizationId, projectId, agentId, type }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ExtractionAgentSessionsRoutes.getAll.response>(
      ExtractionAgentSessionsRoutes.getAll.getPath({
        organizationId,
        projectId,
        agentId,
      }),
      { payload: { type } } satisfies typeof ExtractionAgentSessionsRoutes.getAll.request,
    )
    return response.data.data.map(fromExtractionAgentSessionSummaryDto)
  },
  getOne: async ({ organizationId, projectId, agentId, runId, type }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ExtractionAgentSessionsRoutes.getOne.response>(
      ExtractionAgentSessionsRoutes.getOne.getPath({
        organizationId,
        projectId,
        agentId,
        runId,
      }),
      { payload: { type } } satisfies typeof ExtractionAgentSessionsRoutes.getOne.request,
    )
    return fromExtractionAgentSessionDto(response.data.data)
  },
  executeOne: async ({ organizationId, projectId, agentId, documentId, type }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ExtractionAgentSessionsRoutes.executeOne.response>(
      ExtractionAgentSessionsRoutes.executeOne.getPath({
        organizationId,
        projectId,
        agentId,
      }),
      {
        payload: { documentId, type },
      } satisfies typeof ExtractionAgentSessionsRoutes.executeOne.request,
      { timeout: 30 * 1000 }, // 30 seconds timeout for execution as it might take longer than regular API calls
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
