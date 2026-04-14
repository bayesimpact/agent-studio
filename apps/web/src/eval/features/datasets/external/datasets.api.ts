import {
  type DatasetFileColumnDto,
  type DatasetFileDto,
  type EvaluationDatasetDto,
  EvaluationDatasetsRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { DatasetFile, DatasetFileColumn, EvaluationDataset } from "../datasets.models"
import type { IDatasetsSpi } from "../datasets.spi"

export default {
  getAllFiles: async (params) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof EvaluationDatasetsRoutes.getAllFiles.response>(
      EvaluationDatasetsRoutes.getAllFiles.getPath(params),
    )
    return response.data.data.map(toDatasetFile)
  },
  createOne: async ({ payload, ...params }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof EvaluationDatasetsRoutes.createOne.response>(
      EvaluationDatasetsRoutes.createOne.getPath(params),
      { payload } satisfies typeof EvaluationDatasetsRoutes.createOne.request,
    )
    return toDataset(response.data.data)
  },
  getColumns: async ({ payload, ...params }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof EvaluationDatasetsRoutes.getColumns.response>(
      EvaluationDatasetsRoutes.getColumns.getPath(params),
      { payload } satisfies typeof EvaluationDatasetsRoutes.getColumns.request,
    )
    return response.data.data.map(toDatasetFileColumn)
  },
} satisfies IDatasetsSpi

function toDatasetFile(dto: DatasetFileDto): DatasetFile {
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

function toDataset(dto: EvaluationDatasetDto): EvaluationDataset {
  return {
    createdAt: dto.createdAt,
    documentId: dto.documentId,
    id: dto.id,
    name: dto.name,
    projectId: dto.projectId,
    schemaMapping: dto.schemaMapping,
    updatedAt: dto.updatedAt,
  }
}

function toDatasetFileColumn(dto: DatasetFileColumnDto): DatasetFileColumn {
  return { id: dto.id, name: dto.name, values: dto.values }
}
