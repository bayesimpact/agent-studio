import {
  type BaseAgentSessionTypeDto,
  type ExtractionAgentSessionDto,
  type ExtractionAgentSessionSummaryDto,
  ExtractionAgentSessionsRoutes,
} from "@caseai-connect/api-contracts"
import { Body, Controller, NotFoundException, Param, Post, Req, UseGuards } from "@nestjs/common"
import type { EndpointRequestWithAgent } from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import { getTraceUrl } from "@/external/langfuse/langfuse-helper"
import { BaseAgentSessionGuard } from "../base-agent-sessions/base-agent-session.guard"
import type { BaseAgentSessionType } from "../base-agent-sessions/base-agent-sessions.types"
import type { ExtractionAgentSession } from "./extraction-agent-session.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ExtractionAgentSessionsService } from "./extraction-agent-sessions.service"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, BaseAgentSessionGuard)
@RequireContext("organization", "project", "agent")
@Controller()
export class ExtractionAgentSessionsController {
  constructor(private readonly extractionAgentSessionsService: ExtractionAgentSessionsService) {}

  @Post(ExtractionAgentSessionsRoutes.executeOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  async executeOne(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof ExtractionAgentSessionsRoutes.executeOne.request,
  ): Promise<typeof ExtractionAgentSessionsRoutes.executeOne.response> {
    return this.executeOneByType({ request, payload, type: payload.type })
  }

  @Post(ExtractionAgentSessionsRoutes.getAll.path)
  @CheckPolicy((policy) => policy.canList())
  async getAll(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof ExtractionAgentSessionsRoutes.getAll.request,
  ): Promise<typeof ExtractionAgentSessionsRoutes.getAll.response> {
    return this.getAllByType({ request, type: payload.type })
  }

  @Post(ExtractionAgentSessionsRoutes.getOne.path)
  @CheckPolicy((policy) => policy.canList())
  async getOne(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof ExtractionAgentSessionsRoutes.getOne.request,
    @Param("runId") runId: string,
  ): Promise<typeof ExtractionAgentSessionsRoutes.getOne.response> {
    return this.getOneByType({ request, runId, type: payload.type })
  }

  private async executeOneByType({
    request,
    payload,
    type,
  }: {
    request: EndpointRequestWithAgent
    payload: { documentId: string; promptOverride?: string }
    type: BaseAgentSessionTypeDto
  }) {
    const run = await this.extractionAgentSessionsService.executeExtraction({
      connectScope: getRequiredConnectScope(request),
      agent: request.agent,
      userId: request.user.id,
      documentId: payload.documentId,
      promptOverride: payload.promptOverride,
      type,
    })

    return { data: { runId: run.id, result: run.result ?? {} } }
  }

  private async getAllByType({
    request,
    type,
  }: {
    request: EndpointRequestWithAgent
    type: BaseAgentSessionTypeDto
  }) {
    const runs = await this.extractionAgentSessionsService.listRuns({
      connectScope: getRequiredConnectScope(request),
      agentId: request.agent.id,
      type,
    })
    return { data: runs.map(toSummaryDto(type)) }
  }

  private async getOneByType({
    request,
    runId,
    type,
  }: {
    request: EndpointRequestWithAgent
    runId: string
    type: BaseAgentSessionTypeDto
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

    return { data: toDto(type)(run) }
  }
}

function toSummaryDto(agentSessionType: BaseAgentSessionType) {
  return (entity: ExtractionAgentSession): ExtractionAgentSessionSummaryDto => {
    const traceUrl = agentSessionType === "live" ? undefined : getTraceUrl(entity.traceId)
    return {
      id: entity.id,
      agentId: entity.agentId,
      documentId: entity.documentId,
      documentFileName: entity.document?.fileName ?? null,
      traceUrl,
      type: entity.type,
      status: entity.status,
      createdAt: entity.createdAt.getTime(),
      updatedAt: entity.updatedAt.getTime(),
    }
  }
}

function toDto(agentSessionType: BaseAgentSessionType) {
  return (entity: ExtractionAgentSession): ExtractionAgentSessionDto => {
    return {
      ...toSummaryDto(agentSessionType)(entity),
      result: entity.result,
      errorCode: entity.errorCode,
      errorDetails: entity.errorDetails,
    }
  }
}
