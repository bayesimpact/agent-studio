import {
  type ExtractionAgentSessionDto,
  type ExtractionAgentSessionStatusChangedEventDto,
  type ExtractionAgentSessionSummaryDto,
  ExtractionAgentSessionsRoutes,
} from "@caseai-connect/api-contracts"
import {
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Post,
  Req,
  Sse,
  UnprocessableEntityException,
  UseGuards,
} from "@nestjs/common"
import { filter, map, type Observable } from "rxjs"
import type {
  EndpointRequestWithAgent,
  EndpointRequestWithAgentSession,
} from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { AddContext, RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { TrackActivity } from "@/domains/activities/track-activity.decorator"
import type { AgentSettings } from "@/domains/agents/settings/agent-settings.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSettingsService } from "@/domains/agents/settings/agent-settings.service"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import { getTraceUrl } from "@/external/langfuse/langfuse-helper"
import { BaseAgentSessionGuard } from "../base-agent-sessions/base-agent-session.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { BaseAgentSessionsService } from "../base-agent-sessions/base-agent-sessions.service"
import type { BaseAgentSessionType } from "../base-agent-sessions/base-agent-sessions.types"
import type { ExtractionAgentSession } from "./extraction-agent-session.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ExtractionAgentSessionStatusStreamService } from "./extraction-agent-session-status-stream.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ExtractionAgentSessionsService } from "./extraction-agent-sessions.service"

// BaseAgentSessionGuard is applied per-method rather than at class level because
// the SSE stream endpoint is a bodyless GET and does not carry payload.type.
@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard)
@RequireContext("organization", "project", "agent")
@Controller()
export class ExtractionAgentSessionsController {
  constructor(
    private readonly extractionAgentSessionsService: ExtractionAgentSessionsService,
    private readonly baseAgentSessionsService: BaseAgentSessionsService,
    private readonly sessionStatusStreamService: ExtractionAgentSessionStatusStreamService,
    private readonly agentSettingsService: AgentSettingsService,
  ) {}

  @Post(ExtractionAgentSessionsRoutes.executeOne.path)
  @UseGuards(BaseAgentSessionGuard)
  @CheckPolicy((policy) => policy.canCreate())
  @TrackActivity({ action: "extractionAgentSession.execute" })
  async executeOne(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof ExtractionAgentSessionsRoutes.executeOne.request,
  ): Promise<typeof ExtractionAgentSessionsRoutes.executeOne.response> {
    const { documentId, type, agentSettingsRevision } = payload

    // `agent_settings.revision` is a Postgres `integer`; anything outside its 32-bit signed range
    // reaches TypeORM as-is and produces a driver error instead of a clean rejection here.
    if (
      agentSettingsRevision !== undefined &&
      !(
        Number.isInteger(agentSettingsRevision) &&
        agentSettingsRevision > 0 &&
        agentSettingsRevision <= 2147483647
      )
    ) {
      throw new ForbiddenException("Settings version must be an integer")
    }
    if (agentSettingsRevision !== undefined && type !== "playground") {
      throw new ForbiddenException(
        "Choosing a settings version is only available in the playground",
      )
    }

    const connectScope = getRequiredConnectScope(request)
    const agentSettings = await this.resolveAgentSettings({
      connectScope,
      agentId: request.agent.id,
      sessionType: type,
      revision: agentSettingsRevision,
    })
    const run = await this.extractionAgentSessionsService.executeExtraction({
      connectScope,
      agent: request.agent,
      agentSettings,
      userId: request.user.id,
      documentId,
      type,
    })
    return { data: { runId: run.id } }
  }

  /**
   * Settings the run is pinned to, which is what its worker will use.
   *
   * A playground run with no explicit revision uses the draft when there is one. The extraction
   * screen renders before its settings history has loaded, so the client cannot always name a
   * revision, and defaulting that window to the published one would run a version the picker does
   * not claim. A live run keeps using the newest published revision; it can never reach here with
   * a revision, that is rejected in the handler.
   */
  private async resolveAgentSettings({
    connectScope,
    agentId,
    sessionType,
    revision,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
    sessionType: BaseAgentSessionType
    revision: number | undefined
  }): Promise<AgentSettings> {
    if (revision === undefined) {
      return sessionType === "playground"
        ? this.agentSettingsService.getLast({ connectScope, agentId, includesDraft: true })
        : this.agentSettingsService.getLast({ connectScope, agentId })
    }

    const agentSettings = await this.agentSettingsService.get({ connectScope, agentId, revision })
    if (!agentSettings) {
      throw new NotFoundException(`Version ${revision} not found for agent ${agentId}`)
    }
    if (agentSettings.isArchived) {
      throw new UnprocessableEntityException(`Version ${revision} is archived and cannot be run`)
    }
    return agentSettings
  }

  @Sse(ExtractionAgentSessionsRoutes.streamSessionStatus.path, { method: 0 /* GET */ })
  streamSessionStatus(
    @Req() request: EndpointRequestWithAgent,
  ): Observable<ExtractionAgentSessionStatusChangedEventDto> {
    const connectScope = getRequiredConnectScope(request)
    return this.sessionStatusStreamService.events$.pipe(
      filter(
        (event) =>
          event.organizationId === connectScope.organizationId &&
          event.projectId === connectScope.projectId &&
          event.agentId === request.agent.id,
      ),
      map((event) => ({ ...event, data: JSON.stringify(event) })),
    )
  }

  @Post(ExtractionAgentSessionsRoutes.getAll.path)
  @UseGuards(BaseAgentSessionGuard)
  @CheckPolicy((policy) => policy.canList())
  async getAll(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof ExtractionAgentSessionsRoutes.getAll.request,
  ): Promise<typeof ExtractionAgentSessionsRoutes.getAll.response> {
    const agentSessions = await this.extractionAgentSessionsService.listRuns({
      connectScope: getRequiredConnectScope(request),
      userId: request.user.id,
      agentId: request.agent.id,
      type: payload.type,
    })
    return { data: agentSessions.map(toSummaryDto(payload.type)) }
  }

  @Post(ExtractionAgentSessionsRoutes.getOne.path)
  @UseGuards(BaseAgentSessionGuard)
  @AddContext("agentSession")
  @CheckPolicy((policy) => policy.canList())
  async getOne(
    @Req() request: EndpointRequestWithAgentSession<ExtractionAgentSession>,
    @Body() { payload }: typeof ExtractionAgentSessionsRoutes.getOne.request,
  ): Promise<typeof ExtractionAgentSessionsRoutes.getOne.response> {
    return { data: toDto(payload.type)(request.agentSession) }
  }

  @Post(ExtractionAgentSessionsRoutes.deleteOne.path)
  @UseGuards(BaseAgentSessionGuard)
  @AddContext("agentSession")
  @CheckPolicy((policy) => policy.canDelete())
  async deleteOne(
    @Req() request: EndpointRequestWithAgentSession<ExtractionAgentSession>,
  ): Promise<typeof ExtractionAgentSessionsRoutes.deleteOne.response> {
    await this.baseAgentSessionsService.deleteAgentSession({
      agentType: "extraction",
      agentId: request.agent.id,
      agentSession: request.agentSession,
    })
    return { data: { success: true } }
  }
}

function toSummaryDto(agentSessionType: BaseAgentSessionType) {
  return (entity: ExtractionAgentSession): ExtractionAgentSessionSummaryDto => {
    const traceUrl = agentSessionType === "live" ? undefined : getTraceUrl(entity.traceId)
    return {
      id: entity.id,
      agentId: entity.agentId,
      agentRevision: entity.agentSettings.revision,
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
