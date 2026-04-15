import {
  type DatasetFileColumnDto,
  type DatasetFileDto,
  type EvaluationDatasetDto,
  type EvaluationDatasetRecordDto,
  EvaluationDatasetsRoutes,
} from "@caseai-connect/api-contracts"
import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common"
import type {
  EndpointRequestWithDocument,
  EndpointRequestWithProject,
} from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { AddContext, RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { TrackActivity } from "@/domains/activities/track-activity.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import type { Document } from "@/domains/documents/document.entity"
import { UserGuard } from "@/domains/users/user.guard"
import type { EvaluationDataset, EvaluationDatasetSchemaMapping } from "./evaluation-dataset.entity"
import { EvaluationDatasetGuard } from "./evaluation-dataset.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DatasetFileColumn, EvaluationDatasetsService } from "./evaluation-datasets.service"
import type { EvaluationDatasetRecord } from "./records/evaluation-dataset-record.entity"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, EvaluationDatasetGuard)
@RequireContext("organization", "project")
@Controller()
export class EvaluationDatasetsController {
  constructor(private readonly evaluationDatasetsService: EvaluationDatasetsService) {}

  @Get(EvaluationDatasetsRoutes.getAll.path)
  @CheckPolicy((policy) => policy.canList())
  async getAll(
    @Req() request: EndpointRequestWithProject,
  ): Promise<typeof EvaluationDatasetsRoutes.getAll.response> {
    const datasets = await this.evaluationDatasetsService.listDatasets({
      connectScope: getRequiredConnectScope(request),
    })
    const datasetWithRecords: EvaluationDatasetDto[] = []
    for (const dataset of datasets) {
      const records = await this.evaluationDatasetsService.listDatasetRecords({
        connectScope: getRequiredConnectScope(request),
        datasetId: dataset.id,
      })
      const evaluationDatasetDto = toEvaluationDatasetDto({ entity: dataset, records })
      datasetWithRecords.push(evaluationDatasetDto)
    }
    return { data: datasetWithRecords }
  }

  @Get(EvaluationDatasetsRoutes.getAllFiles.path)
  @CheckPolicy((policy) => policy.canList())
  async getAllFiles(
    @Req() request: EndpointRequestWithProject,
  ): Promise<typeof EvaluationDatasetsRoutes.getAllFiles.response> {
    const files = await this.evaluationDatasetsService.listFiles({
      connectScope: getRequiredConnectScope(request),
    })
    return { data: files.map(toDatasetFileDto) }
  }

  @Get(EvaluationDatasetsRoutes.getFileColumns.path)
  @AddContext("document")
  @CheckPolicy((policy) => policy.canCreate())
  async getColumns(
    @Req() request: EndpointRequestWithDocument,
  ): Promise<typeof EvaluationDatasetsRoutes.getFileColumns.response> {
    const columns = await this.evaluationDatasetsService.getFileColumns({
      connectScope: getRequiredConnectScope(request),
      documentId: request.document.id,
    })
    return { data: columns.map(toDatasetFileColumnDto) }
  }

  @Post(EvaluationDatasetsRoutes.createOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  @TrackActivity({ action: "evaluationDataset.create" })
  async createOne(
    @Req() request: EndpointRequestWithProject,
    @Body() { payload }: typeof EvaluationDatasetsRoutes.createOne.request,
  ): Promise<typeof EvaluationDatasetsRoutes.createOne.response> {
    await this.evaluationDatasetsService.createDataset({
      connectScope: getRequiredConnectScope(request),
      name: payload.name,
    })

    return { data: { success: true } }
  }

  @Patch(EvaluationDatasetsRoutes.updateOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  @AddContext("document")
  @TrackActivity({ action: "evaluationDataset.update" })
  async updateOne(
    @Req() request: EndpointRequestWithDocument,
    @Body() { payload: { name, columns } }: typeof EvaluationDatasetsRoutes.updateOne.request,
    @Param("datasetId") datasetId: string, // FIXME: should be in request context
  ): Promise<typeof EvaluationDatasetsRoutes.updateOne.response> {
    const connectScope = getRequiredConnectScope(request)
    const documentId = request.document.id

    await this.evaluationDatasetsService.updateDataset({
      connectScope,
      datasetId,
      fields: { name, documentId, columns },
    })

    await this.evaluationDatasetsService.createDatasetRecords({
      connectScope,
      datasetId,
      documentId,
    })

    return { data: { success: true } }
  }
}

function toDatasetFileDto(document: Document): DatasetFileDto {
  return {
    createdAt: document.createdAt.getTime(),
    fileName: document.fileName,
    id: document.id,
    projectId: document.projectId,
    size: document.size,
    storageRelativePath: document.storageRelativePath,
    updatedAt: document.updatedAt.getTime(),
  }
}
function toDatasetFileColumnDto(v: DatasetFileColumn): DatasetFileColumnDto {
  return {
    id: v.id,
    name: v.name,
    values: v.values.map((v) => (typeof v === "string" ? v : JSON.stringify(v))),
  }
}

function toEvaluationDatasetDto({
  entity,
  records,
}: {
  entity: EvaluationDataset
  records: EvaluationDatasetRecord[]
}): EvaluationDatasetDto {
  return {
    createdAt: entity.createdAt.getTime(),
    id: entity.id,
    name: entity.name,
    projectId: entity.projectId,
    schemaMapping: entity.schemaMapping,
    updatedAt: entity.updatedAt.getTime(),
    documentIds: entity.evaluationDatasetDocuments.map((d) => d.documentId),
    records: toEvaluationDatasetRecordDto({ records, schemaMapping: entity.schemaMapping }),
  }
}

function toEvaluationDatasetRecordDto({
  records,
  schemaMapping,
}: {
  records: EvaluationDatasetRecord[]
  schemaMapping: EvaluationDatasetSchemaMapping
}): EvaluationDatasetRecordDto[] {
  const columns = Object.values(schemaMapping)
  return columns.map((column) => ({
    columnId: column.id,
    columnName: column.finalName,
    values: records.map((record) => record.data[column.id]),
  }))
}
