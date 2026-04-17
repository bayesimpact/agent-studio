import {
  type EvaluationExtractionRunDto,
  type EvaluationExtractionRunRecordDto,
  EvaluationExtractionRunsRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type {
  EvaluationExtractionRun,
  EvaluationExtractionRunRecord,
} from "../evaluation-extraction-runs.models"
import type { IEvaluationExtractionRunsSpi } from "../evaluation-extraction-runs.spi"
import { streamEvaluationExtractionRunStatus } from "./evaluation-extraction-runs-streaming"

export default {
  createOne: async ({ payload, ...params }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof EvaluationExtractionRunsRoutes.createOne.response>(
      EvaluationExtractionRunsRoutes.createOne.getPath(params),
      { payload } satisfies typeof EvaluationExtractionRunsRoutes.createOne.request,
    )
    return toEvaluationExtractionRun(response.data.data)
  },
  executeOne: async (params) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof EvaluationExtractionRunsRoutes.executeOne.response>(
      EvaluationExtractionRunsRoutes.executeOne.getPath(params),
    )
    return toEvaluationExtractionRun(response.data.data)
  },
  getOne: async (params) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof EvaluationExtractionRunsRoutes.getOne.response>(
      EvaluationExtractionRunsRoutes.getOne.getPath(params),
    )
    return toEvaluationExtractionRun(response.data.data)
  },
  getAll: async (params) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof EvaluationExtractionRunsRoutes.getAll.response>(
      EvaluationExtractionRunsRoutes.getAll.getPath(params),
    )
    return response.data.data.map(toEvaluationExtractionRun)
  },
  getRecords: async (params) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof EvaluationExtractionRunsRoutes.getRecords.response>(
      EvaluationExtractionRunsRoutes.getRecords.getPath(params),
    )
    return response.data.data.map(toEvaluationExtractionRunRecord)
  },
  streamRunStatus: async (params) => {
    await streamEvaluationExtractionRunStatus(params)
  },
} satisfies IEvaluationExtractionRunsSpi

function toEvaluationExtractionRun(dto: EvaluationExtractionRunDto): EvaluationExtractionRun {
  return {
    id: dto.id,
    evaluationExtractionDatasetId: dto.evaluationExtractionDatasetId,
    agentId: dto.agentId,
    keyMapping: dto.keyMapping,
    status: dto.status,
    summary: dto.summary,
    projectId: dto.projectId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

function toEvaluationExtractionRunRecord(
  dto: EvaluationExtractionRunRecordDto,
): EvaluationExtractionRunRecord {
  return {
    id: dto.id,
    evaluationExtractionRunId: dto.evaluationExtractionRunId,
    evaluationExtractionDatasetRecordId: dto.evaluationExtractionDatasetRecordId,
    status: dto.status,
    comparison: dto.comparison,
    agentRawOutput: dto.agentRawOutput,
    errorDetails: dto.errorDetails,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}
