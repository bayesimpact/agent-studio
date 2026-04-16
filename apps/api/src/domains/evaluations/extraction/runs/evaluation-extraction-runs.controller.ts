import {
  type EvaluationExtractionRunDto,
  type EvaluationExtractionRunRecordDto,
  EvaluationExtractionRunsRoutes,
} from "@caseai-connect/api-contracts"
import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common"
import type {
  EndpointRequestWithEvaluationExtractionRun,
  EndpointRequestWithProject,
} from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { AddContext, RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { TrackActivity } from "@/domains/activities/track-activity.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import type { EvaluationExtractionRun } from "./evaluation-extraction-run.entity"
import { EvaluationExtractionRunGuard } from "./evaluation-extraction-run.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { EvaluationExtractionRunsService } from "./evaluation-extraction-runs.service"
import type { EvaluationExtractionRunRecord } from "./records/evaluation-extraction-run-record.entity"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, EvaluationExtractionRunGuard)
@RequireContext("organization", "project")
@Controller()
export class EvaluationExtractionRunsController {
  constructor(private readonly evaluationExtractionRunsService: EvaluationExtractionRunsService) {}

  @Post(EvaluationExtractionRunsRoutes.createOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  @TrackActivity({ action: "evaluationExtractionRun.create" })
  async createOne(
    @Req() request: EndpointRequestWithProject,
    @Body() { payload }: typeof EvaluationExtractionRunsRoutes.createOne.request,
  ): Promise<typeof EvaluationExtractionRunsRoutes.createOne.response> {
    const run = await this.evaluationExtractionRunsService.createRun({
      connectScope: getRequiredConnectScope(request),
      fields: {
        evaluationExtractionDatasetId: payload.evaluationExtractionDatasetId,
        agentId: payload.agentId,
        keyMapping: payload.keyMapping,
      },
    })
    return { data: toEvaluationExtractionRunDto(run) }
  }

  @Post(EvaluationExtractionRunsRoutes.executeOne.path)
  @AddContext("evaluationExtractionRun")
  @CheckPolicy((policy) => policy.canUpdate())
  @TrackActivity({ action: "evaluationExtractionRun.execute" })
  async executeOne(
    @Req() request: EndpointRequestWithEvaluationExtractionRun,
  ): Promise<typeof EvaluationExtractionRunsRoutes.executeOne.response> {
    const run = await this.evaluationExtractionRunsService.executeRun({
      connectScope: getRequiredConnectScope(request),
      runId: request.evaluationExtractionRun.id,
    })
    return { data: toEvaluationExtractionRunDto(run) }
  }

  @Get(EvaluationExtractionRunsRoutes.getOne.path)
  @AddContext("evaluationExtractionRun")
  @CheckPolicy((policy) => policy.canList())
  async getOne(
    @Req() request: EndpointRequestWithEvaluationExtractionRun,
  ): Promise<typeof EvaluationExtractionRunsRoutes.getOne.response> {
    return { data: toEvaluationExtractionRunDto(request.evaluationExtractionRun) }
  }

  @Get(EvaluationExtractionRunsRoutes.getAll.path)
  @CheckPolicy((policy) => policy.canList())
  async getAll(
    @Req() request: EndpointRequestWithProject,
  ): Promise<typeof EvaluationExtractionRunsRoutes.getAll.response> {
    const runs = await this.evaluationExtractionRunsService.listRuns({
      connectScope: getRequiredConnectScope(request),
    })
    return { data: runs.map(toEvaluationExtractionRunDto) }
  }

  @Get(EvaluationExtractionRunsRoutes.getRecords.path)
  @AddContext("evaluationExtractionRun")
  @CheckPolicy((policy) => policy.canList())
  async getRecords(
    @Req() request: EndpointRequestWithEvaluationExtractionRun,
  ): Promise<typeof EvaluationExtractionRunsRoutes.getRecords.response> {
    const records = await this.evaluationExtractionRunsService.getRunRecords({
      connectScope: getRequiredConnectScope(request),
      runId: request.evaluationExtractionRun.id,
    })
    return { data: records.map(toEvaluationExtractionRunRecordDto) }
  }
}

function toEvaluationExtractionRunDto(run: EvaluationExtractionRun): EvaluationExtractionRunDto {
  return {
    id: run.id,
    evaluationExtractionDatasetId: run.evaluationExtractionDatasetId,
    agentId: run.agentId,
    keyMapping: run.keyMapping,
    status: run.status,
    summary: run.summary,
    projectId: run.projectId,
    createdAt: run.createdAt.getTime(),
    updatedAt: run.updatedAt.getTime(),
  }
}

function toEvaluationExtractionRunRecordDto(
  record: EvaluationExtractionRunRecord,
): EvaluationExtractionRunRecordDto {
  return {
    id: record.id,
    evaluationExtractionRunId: record.evaluationExtractionRunId,
    evaluationExtractionDatasetRecordId: record.evaluationExtractionDatasetRecordId,
    status: record.status,
    comparison: record.comparison,
    agentRawOutput: record.agentRawOutput,
    errorDetails: record.errorDetails,
    createdAt: record.createdAt.getTime(),
    updatedAt: record.updatedAt.getTime(),
  }
}
