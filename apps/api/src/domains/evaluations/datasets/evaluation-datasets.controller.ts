import {
  type DatasetFileColumnDto,
  type DatasetFileDto,
  type EvaluationDatasetDto,
  EvaluationDatasetsRoutes,
} from "@caseai-connect/api-contracts"
import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common"
import type { EndpointRequestWithProject } from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { TrackActivity } from "@/domains/activities/track-activity.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import type { Document } from "@/domains/documents/document.entity"
import { UserGuard } from "@/domains/users/user.guard"
import type { EvaluationDataset } from "./evaluation-dataset.entity"
import { EvaluationDatasetGuard } from "./evaluation-dataset.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DatasetFileColumn, EvaluationDatasetsService } from "./evaluation-datasets.service"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, EvaluationDatasetGuard)
@RequireContext("organization", "project")
@Controller()
export class EvaluationDatasetsController {
  constructor(private readonly evaluationDatasetsService: EvaluationDatasetsService) {}

  @Get(EvaluationDatasetsRoutes.getAllFiles.path)
  @CheckPolicy((policy) => policy.canList())
  async getAllFiles(
    @Req() request: EndpointRequestWithProject,
  ): Promise<typeof EvaluationDatasetsRoutes.getAllFiles.response> {
    const files = await this.evaluationDatasetsService.listDatasetFiles({
      connectScope: getRequiredConnectScope(request),
    })

    return { data: files.map(toDatasetFileDto) }
  }

  @Post(EvaluationDatasetsRoutes.getColumns.path)
  @CheckPolicy((policy) => policy.canCreate())
  // TODO: add context of the document to check if user can access the document
  // TODO: @TrackActivity
  async getColumns(
    @Req() request: EndpointRequestWithProject,
    @Body() { payload }: typeof EvaluationDatasetsRoutes.getColumns.request,
  ): Promise<typeof EvaluationDatasetsRoutes.getColumns.response> {
    const columns = await this.evaluationDatasetsService.getFileColumns({
      connectScope: getRequiredConnectScope(request),
      documentId: payload.documentId,
    })
    return { data: columns.map(toDatasetFileColumnDto) }
  }

  @Post(EvaluationDatasetsRoutes.createOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  // TODO: add context of the document to check if user can access the document
  @TrackActivity({ action: "evaluationDataset.create" })
  async createOne(
    @Req() request: EndpointRequestWithProject,
    @Body() { payload }: typeof EvaluationDatasetsRoutes.createOne.request,
  ): Promise<typeof EvaluationDatasetsRoutes.createOne.response> {
    const connectScope = getRequiredConnectScope(request)

    const dataset = await this.evaluationDatasetsService.createDataset({
      connectScope,
      fields: payload,
    })

    const _records = await this.evaluationDatasetsService.createDatasetRecords({
      connectScope,
      datasetId: dataset.id,
    })

    return { data: toEvaluationDatasetDto(dataset) }
  }

  // @Delete(EvaluationDatasetsRoutes.deleteOne.path)
  // @CheckPolicy((policy) => policy.canDelete())
  // @AddContext("evaluationDataset")
  // @TrackActivity({ action: "evaluationDataset.delete", entityFrom: "evaluationDataset" })
  // async deleteOne(
  //   @Req() request: EndpointRequestWithEvaluationDataset,
  // ): Promise<typeof EvaluationDatasetsRoutes.deleteOne.response> {
  //   await this.evaluationDatasetsService.deleteDataset({
  //     connectScope: getRequiredConnectScope(request),
  //     datasetId: request.evaluationDataset.id,
  //   })

  //   return { data: { success: true } }
  // }

  // @Patch(EvaluationDatasetsRoutes.setColumnRoles.path)
  // @CheckPolicy((policy) => policy.canUpdate())
  // @AddContext("evaluationDataset")
  // @TrackActivity({
  //   action: "evaluationDataset.setColumnRoles",
  //   entityFrom: "evaluationDataset",
  // })
  // async setColumnRoles(
  //   @Req() request: EndpointRequestWithEvaluationDataset,
  //   @Body() { payload }: typeof EvaluationDatasetsRoutes.setColumnRoles.request,
  // ): Promise<typeof EvaluationDatasetsRoutes.setColumnRoles.response> {
  //   const columns = await this.evaluationDatasetsService.setColumnRoles({
  //     connectScope: getRequiredConnectScope(request),
  //     datasetId: request.evaluationDataset.id,
  //     columns: payload.columns,
  //   })

  //   return { data: { columns } }
  // }
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

function toEvaluationDatasetDto(entity: EvaluationDataset): EvaluationDatasetDto {
  return {
    createdAt: entity.createdAt.getTime(),
    documentId: entity.documentId,
    id: entity.id,
    name: entity.name,
    projectId: entity.projectId,
    schemaMapping: entity.schemaMapping,
    updatedAt: entity.updatedAt.getTime(),
  }
}
