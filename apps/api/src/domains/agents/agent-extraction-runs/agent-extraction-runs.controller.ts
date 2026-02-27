import {
  type AgentExtractionRunDto,
  type AgentExtractionRunSummaryDto,
  AgentExtractionRunsRoutes,
  type AgentExtractionRunType,
} from "@caseai-connect/api-contracts"
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common"
import type { EndpointRequestWithAgent } from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import { getTraceUrl } from "@/external/langfuse/langfuse-helper"
import type { AgentExtractionRun } from "./agent-extraction-run.entity"
import { AgentExtractionRunsGuard } from "./agent-extraction-runs.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentExtractionRunsService } from "./agent-extraction-runs.service"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, AgentExtractionRunsGuard)
@RequireContext("organization", "project", "agent")
@Controller()
export class AgentExtractionRunsController {
  constructor(private readonly agentExtractionRunsService: AgentExtractionRunsService) {}

  @Post(AgentExtractionRunsRoutes.executePlaygroundOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  async executePlaygroundOne(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof AgentExtractionRunsRoutes.executePlaygroundOne.request,
  ): Promise<typeof AgentExtractionRunsRoutes.executePlaygroundOne.response> {
    return this.executeOneByType({ request, payload, type: "playground" })
  }

  @Post(AgentExtractionRunsRoutes.executeLiveOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  async executeLiveOne(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof AgentExtractionRunsRoutes.executeLiveOne.request,
  ): Promise<typeof AgentExtractionRunsRoutes.executeLiveOne.response> {
    return this.executeOneByType({ request, payload, type: "live" })
  }

  @Get(AgentExtractionRunsRoutes.getAllPlayground.path)
  @CheckPolicy((policy) => policy.canList())
  async getAllPlayground(
    @Req() request: EndpointRequestWithAgent,
  ): Promise<typeof AgentExtractionRunsRoutes.getAllPlayground.response> {
    return this.getAllByType({ request, type: "playground" })
  }

  @Get(AgentExtractionRunsRoutes.getAllLive.path)
  @CheckPolicy((policy) => policy.canList())
  async getAllLive(
    @Req() request: EndpointRequestWithAgent,
  ): Promise<typeof AgentExtractionRunsRoutes.getAllLive.response> {
    return this.getAllByType({ request, type: "live" })
  }

  @Get(AgentExtractionRunsRoutes.getOnePlayground.path)
  @CheckPolicy((policy) => policy.canList())
  async getOnePlayground(
    @Req() request: EndpointRequestWithAgent,
    @Param("runId") runId: string,
  ): Promise<typeof AgentExtractionRunsRoutes.getOnePlayground.response> {
    return this.getOneByType({ request, runId, type: "playground" })
  }

  @Get(AgentExtractionRunsRoutes.getOneLive.path)
  @CheckPolicy((policy) => policy.canList())
  async getOneLive(
    @Req() request: EndpointRequestWithAgent,
    @Param("runId") runId: string,
  ): Promise<typeof AgentExtractionRunsRoutes.getOneLive.response> {
    return this.getOneByType({ request, runId, type: "live" })
  }

  private async executeOneByType({
    request,
    payload,
    type,
  }: {
    request: EndpointRequestWithAgent
    payload: { documentId: string; promptOverride?: string }
    type: AgentExtractionRunType
  }) {
    const run = await this.agentExtractionRunsService.executeExtraction({
      connectScope: getRequiredConnectScope(request),
      agent: request.agent,
      userId: request.user.id,
      documentId: payload.documentId,
      promptOverride: payload.promptOverride,
      type,
    })

    return {
      data: {
        runId: run.id,
        result: run.result ?? {},
      },
    }
  }

  private async getAllByType({
    request,
    type,
  }: {
    request: EndpointRequestWithAgent
    type: AgentExtractionRunType
  }) {
    const runs = await this.agentExtractionRunsService.listRuns({
      connectScope: getRequiredConnectScope(request),
      agentId: request.agent.id,
      type,
    })

    return { data: runs.map(toSummaryDto) }
  }

  private async getOneByType({
    request,
    runId,
    type,
  }: {
    request: EndpointRequestWithAgent
    runId: string
    type: AgentExtractionRunType
  }) {
    const run = await this.agentExtractionRunsService.findRunById({
      connectScope: getRequiredConnectScope(request),
      runId,
      agentId: request.agent.id,
      type,
    })

    if (!run) {
      throw new NotFoundException(`AgentExtractionRun with id ${runId} not found`)
    }

    return { data: toDto(run) }
  }
}

function toSummaryDto(entity: AgentExtractionRun): AgentExtractionRunSummaryDto {
  return {
    id: entity.id,
    agentId: entity.agentId,
    documentId: entity.documentId,
    documentFileName: entity.document?.fileName ?? null,
    traceUrl: entity.traceId ? getTraceUrl(entity.traceId) : undefined,
    type: entity.type,
    status: entity.status,
    createdAt: entity.createdAt.getTime(),
    updatedAt: entity.updatedAt.getTime(),
  }
}

function toDto(entity: AgentExtractionRun): AgentExtractionRunDto {
  return {
    ...toSummaryDto(entity),
    result: entity.result,
    errorCode: entity.errorCode,
    errorDetails: entity.errorDetails,
  }
}
