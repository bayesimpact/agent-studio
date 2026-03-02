import {
  type ExtractionAgentSessionDto,
  type ExtractionAgentSessionSummaryDto,
  ExtractionAgentSessionsRoutes,
  type ExtractionAgentSessionType,
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
import type { ExtractionAgentSession } from "./extraction-agent-session.entity"
import { ExtractionAgentSessionsGuard } from "./extraction-agent-sessions.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ExtractionAgentSessionsService } from "./extraction-agent-sessions.service"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, ExtractionAgentSessionsGuard)
@RequireContext("organization", "project", "agent")
@Controller()
export class ExtractionAgentSessionsController {
  constructor(private readonly extractionAgentSessionsService: ExtractionAgentSessionsService) {}

  @Post(ExtractionAgentSessionsRoutes.executePlaygroundOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  async executePlaygroundOne(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof ExtractionAgentSessionsRoutes.executePlaygroundOne.request,
  ): Promise<typeof ExtractionAgentSessionsRoutes.executePlaygroundOne.response> {
    return this.executeOneByType({ request, payload, type: "playground" })
  }

  @Post(ExtractionAgentSessionsRoutes.executeLiveOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  async executeLiveOne(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof ExtractionAgentSessionsRoutes.executeLiveOne.request,
  ): Promise<typeof ExtractionAgentSessionsRoutes.executeLiveOne.response> {
    return this.executeOneByType({ request, payload, type: "live" })
  }

  @Get(ExtractionAgentSessionsRoutes.getAllPlayground.path)
  @CheckPolicy((policy) => policy.canList())
  async getAllPlayground(
    @Req() request: EndpointRequestWithAgent,
  ): Promise<typeof ExtractionAgentSessionsRoutes.getAllPlayground.response> {
    return this.getAllByType({ request, type: "playground" })
  }

  @Get(ExtractionAgentSessionsRoutes.getAllLive.path)
  @CheckPolicy((policy) => policy.canList())
  async getAllLive(
    @Req() request: EndpointRequestWithAgent,
  ): Promise<typeof ExtractionAgentSessionsRoutes.getAllLive.response> {
    return this.getAllByType({ request, type: "live" })
  }

  @Get(ExtractionAgentSessionsRoutes.getOnePlayground.path)
  @CheckPolicy((policy) => policy.canList())
  async getOnePlayground(
    @Req() request: EndpointRequestWithAgent,
    @Param("runId") runId: string,
  ): Promise<typeof ExtractionAgentSessionsRoutes.getOnePlayground.response> {
    return this.getOneByType({ request, runId, type: "playground" })
  }

  @Get(ExtractionAgentSessionsRoutes.getOneLive.path)
  @CheckPolicy((policy) => policy.canList())
  async getOneLive(
    @Req() request: EndpointRequestWithAgent,
    @Param("runId") runId: string,
  ): Promise<typeof ExtractionAgentSessionsRoutes.getOneLive.response> {
    return this.getOneByType({ request, runId, type: "live" })
  }

  private async executeOneByType({
    request,
    payload,
    type,
  }: {
    request: EndpointRequestWithAgent
    payload: { documentId: string; promptOverride?: string }
    type: ExtractionAgentSessionType
  }) {
    const run = await this.extractionAgentSessionsService.executeExtraction({
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
    type: ExtractionAgentSessionType
  }) {
    const runs = await this.extractionAgentSessionsService.listRuns({
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
    type: ExtractionAgentSessionType
  }) {
    const run = await this.extractionAgentSessionsService.findRunById({
      connectScope: getRequiredConnectScope(request),
      runId,
      agentId: request.agent.id,
      type,
    })

    if (!run) {
      throw new NotFoundException(`ExtractionAgentSession with id ${runId} not found`)
    }

    return { data: toDto(run) }
  }
}

function toSummaryDto(entity: ExtractionAgentSession): ExtractionAgentSessionSummaryDto {
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

function toDto(entity: ExtractionAgentSession): ExtractionAgentSessionDto {
  return {
    ...toSummaryDto(entity),
    result: entity.result,
    errorCode: entity.errorCode,
    errorDetails: entity.errorDetails,
  }
}
