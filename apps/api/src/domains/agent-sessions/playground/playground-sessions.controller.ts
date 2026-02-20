import type { AgentSessionDto } from "@caseai-connect/api-contracts"
import { Controller, Get, Post, Req, UseGuards } from "@nestjs/common"
import type { EndpointRequestWithAgent } from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import { getTraceUrl } from "@/external/langfuse/langfuse-helper"
import type { AgentSession } from "../agent-session.entity"
import { AgentSessionsRoutes } from "../agent-sessions.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSessionsService } from "../agent-sessions.service"
import { PlaygroundSessionGuard } from "./playground-session.guard"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, PlaygroundSessionGuard)
@RequireContext("organization", "project", "agent")
@Controller()
export class PlaygroundSessionsController {
  constructor(private readonly agentSessionsService: AgentSessionsService) {}

  @CheckPolicy((policy) => policy.canList())
  @Get(AgentSessionsRoutes.getAllPlaygroundSessions.path)
  async getAllPlaygroundSessions(
    @Req() request: EndpointRequestWithAgent,
  ): Promise<typeof AgentSessionsRoutes.getAllPlaygroundSessions.response> {
    const sessions = await this.agentSessionsService.getAllSessionsForAgent({
      connectScope: getRequiredConnectScope(request),
      agentId: request.agent.id,
      userId: request.user.id,
      type: "playground",
    })

    return { data: sessions.map(toAgentSessionDtoWithTraceUrl) }
  }

  @CheckPolicy((policy) => policy.canCreate())
  @Post(AgentSessionsRoutes.createPlaygroundSession.path)
  async createPlaygroundSession(
    @Req() request: EndpointRequestWithAgent,
  ): Promise<typeof AgentSessionsRoutes.createPlaygroundSession.response> {
    const session = await this.agentSessionsService.createPlaygroundSession({
      connectScope: getRequiredConnectScope(request),
      agentId: request.agent.id,
      userId: request.user.id,
    })

    return { data: toAgentSessionDtoWithTraceUrl(session) }
  }
}

function toAgentSessionDtoWithTraceUrl(entity: AgentSession): AgentSessionDto {
  return {
    id: entity.id,
    agentId: entity.agentId,
    type: entity.type,
    createdAt: entity.createdAt.getTime(),
    updatedAt: entity.updatedAt.getTime(),
    traceUrl: getTraceUrl(entity.traceId),
  }
}
