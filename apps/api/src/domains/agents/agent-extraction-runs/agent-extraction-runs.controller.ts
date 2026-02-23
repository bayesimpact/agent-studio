import {
  type AgentExtractionRunDto,
  type AgentExtractionRunSummaryDto,
  AgentExtractionRunsRoutes,
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
import type { AgentExtractionRun } from "./agent-extraction-run.entity"
import { AgentExtractionRunsGuard } from "./agent-extraction-runs.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentExtractionRunsService } from "./agent-extraction-runs.service"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, AgentExtractionRunsGuard)
@RequireContext("organization", "project", "agent")
@Controller()
export class AgentExtractionRunsController {
  constructor(private readonly agentExtractionRunsService: AgentExtractionRunsService) {}

  @Post(AgentExtractionRunsRoutes.executeOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  async executeOne(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof AgentExtractionRunsRoutes.executeOne.request,
  ): Promise<typeof AgentExtractionRunsRoutes.executeOne.response> {
    const run = await this.agentExtractionRunsService.executeExtraction({
      connectScope: getRequiredConnectScope(request),
      agent: request.agent,
      userId: request.user.id,
      documentId: payload.documentId,
      promptOverride: payload.promptOverride,
    })

    return {
      data: {
        runId: run.id,
        result: run.result ?? {},
      },
    }
  }

  @Get(AgentExtractionRunsRoutes.getAll.path)
  @CheckPolicy((policy) => policy.canList())
  async getAll(
    @Req() request: EndpointRequestWithAgent,
  ): Promise<typeof AgentExtractionRunsRoutes.getAll.response> {
    const runs = await this.agentExtractionRunsService.listRuns({
      connectScope: getRequiredConnectScope(request),
      agentId: request.agent.id,
    })

    return { data: { runs: runs.map(toSummaryDto) } }
  }

  @Get(AgentExtractionRunsRoutes.getOne.path)
  @CheckPolicy((policy) => policy.canList())
  async getOne(
    @Req() request: EndpointRequestWithAgent,
    @Param("runId") runId: string,
  ): Promise<typeof AgentExtractionRunsRoutes.getOne.response> {
    const run = await this.agentExtractionRunsService.findRunById({
      connectScope: getRequiredConnectScope(request),
      runId,
      agentId: request.agent.id,
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
