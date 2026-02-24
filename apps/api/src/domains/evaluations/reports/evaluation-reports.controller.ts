import { type EvaluationReportDto, EvaluationReportsRoutes } from "@caseai-connect/api-contracts"
import { Controller, Get, Post, Req, UseGuards } from "@nestjs/common"
import { v4 } from "uuid"
import type {
  EndpointRequestWithAgent,
  EndpointRequestWithEvaluation,
} from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { AddContext, RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import { getTraceUrl } from "@/external/langfuse/langfuse-helper"
import type { EvaluationReport } from "./evaluation-report.entity"
import { EvaluationReportGuard } from "./evaluation-report.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { EvaluationReportsService } from "./evaluation-reports.service"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, EvaluationReportGuard)
@RequireContext("organization", "project", "evaluation")
@Controller()
export class EvaluationReportsController {
  constructor(private readonly reportsService: EvaluationReportsService) {}

  @Post(EvaluationReportsRoutes.createOne.path)
  @AddContext("agent")
  @CheckPolicy((policy) => policy.canCreate())
  async createOne(
    @Req() request: EndpointRequestWithEvaluation & EndpointRequestWithAgent,
  ): Promise<typeof EvaluationReportsRoutes.createOne.response> {
    // TODO: call generateText to fill in traceId, output
    // TODO: call evaluate to score once the generation pipeline is implemented
    const report = await this.reportsService.createReport({
      connectScope: getRequiredConnectScope(request),
      evaluationId: request.evaluation.id,
      fields: {
        agentId: request.agent.id,
        traceId: v4(),
        output: "",
        score: "",
      },
    })
    return { data: toDto(report) }
  }

  @Get(EvaluationReportsRoutes.getAll.path)
  @CheckPolicy((policy) => policy.canList())
  async getAll(
    @Req() request: EndpointRequestWithEvaluation,
  ): Promise<typeof EvaluationReportsRoutes.getAll.response> {
    const reports = await this.reportsService.listReports({
      connectScope: getRequiredConnectScope(request),
      evaluationId: request.evaluation.id,
    })

    return { data: reports.map(toDto) }
  }
}

function toDto(entity: EvaluationReport): EvaluationReportDto {
  return {
    createdAt: entity.createdAt.getTime(),
    id: entity.id,
    evaluationId: entity.evaluationId,
    agentId: entity.agentId,
    traceUrl: getTraceUrl(entity.traceId),
    output: entity.output,
    score: entity.score,
    updatedAt: entity.updatedAt.getTime(),
  }
}
