import {
  type EvaluationExtractionDatasetDto,
  type EvaluationExtractionDatasetFileColumnDto,
  type EvaluationExtractionDatasetFileDto,
  EvaluationExtractionDatasetsRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type {
  EvaluationExtractionDataset,
  EvaluationExtractionDatasetFile,
  EvaluationExtractionDatasetFileColumn,
} from "../evaluation-extraction-datasets.models"
import type { IEvaluationExtractionDatasetsSpi } from "../evaluation-extraction-datasets.spi"

export default {
  getAll: async (params) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof EvaluationExtractionDatasetsRoutes.getAll.response>(
      EvaluationExtractionDatasetsRoutes.getAll.getPath(params),
    )
    return response.data.data.map(toDataset)
  },
  getAllFiles: async (params) => {
    const axios = getAxiosInstance()
    const response = await axios.get<
      typeof EvaluationExtractionDatasetsRoutes.getAllFiles.response
    >(EvaluationExtractionDatasetsRoutes.getAllFiles.getPath(params))
    return response.data.data.map(toEvaluationExtractionDatasetFile)
  },
  createOne: async ({ payload, ...params }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof EvaluationExtractionDatasetsRoutes.createOne.response>(
      EvaluationExtractionDatasetsRoutes.createOne.getPath(params),
      { payload } satisfies typeof EvaluationExtractionDatasetsRoutes.createOne.request,
    )
    return response.data.data
  },
  updateOne: async ({ payload, ...params }) => {
    const axios = getAxiosInstance()
    const response = await axios.patch<
      typeof EvaluationExtractionDatasetsRoutes.updateOne.response
    >(EvaluationExtractionDatasetsRoutes.updateOne.getPath(params), {
      payload,
    } satisfies typeof EvaluationExtractionDatasetsRoutes.updateOne.request)
    return response.data.data
  },
  getFileColumns: async (params) => {
    const axios = getAxiosInstance()
    const response = await axios.get<
      typeof EvaluationExtractionDatasetsRoutes.getFileColumns.response
    >(EvaluationExtractionDatasetsRoutes.getFileColumns.getPath(params))
    return response.data.data.map(toEvaluationExtractionDatasetFileColumn)
  },
} satisfies IEvaluationExtractionDatasetsSpi

function toEvaluationExtractionDatasetFile(
  dto: EvaluationExtractionDatasetFileDto,
): EvaluationExtractionDatasetFile {
  return {
    createdAt: dto.createdAt,
    fileName: dto.fileName,
    id: dto.id,
    projectId: dto.projectId,
    size: dto.size,
    storageRelativePath: dto.storageRelativePath,
    updatedAt: dto.updatedAt,
  }
}

function toDataset(dto: EvaluationExtractionDatasetDto): EvaluationExtractionDataset {
  return {
    createdAt: dto.createdAt,
    documentIds: dto.documentIds,
    id: dto.id,
    name: dto.name,
    projectId: dto.projectId,
    records: dto.records,
    schemaMapping: dto.schemaMapping,
    updatedAt: dto.updatedAt,
  }
}

function toEvaluationExtractionDatasetFileColumn(
  dto: EvaluationExtractionDatasetFileColumnDto,
): EvaluationExtractionDatasetFileColumn {
  return { id: dto.id, name: dto.name, values: dto.values }
}
