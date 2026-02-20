import type { AgentSessionDto } from "@caseai-connect/api-contracts"
import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common"
import type { EndpointRequestWithAgent } from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import type { AgentSession } from "../agent-session.entity"
import { AgentSessionsRoutes } from "../agent-sessions.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSessionsService } from "../agent-sessions.service"
import { AppPrivateSessionGuard } from "./app-private-session.guard"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, AppPrivateSessionGuard)
@RequireContext("organization", "project", "agent")
@Controller()
export class AppPrivateSessionsController {
  constructor(private readonly agentSessionsService: AgentSessionsService) {}

  @CheckPolicy((policy) => policy.canList())
  @Get(AgentSessionsRoutes.getAllAppSessions.path)
  async getAllAppSessions(
    @Req() request: EndpointRequestWithAgent,
  ): Promise<typeof AgentSessionsRoutes.getAllAppSessions.response> {
    const sessions = await this.agentSessionsService.getAllSessionsForAgent({
      connectScope: getRequiredConnectScope(request),
      agentId: request.agent.id,
      userId: request.user.id,
      type: "app-private",
    })

    return { data: sessions.map(toAgentSessionDto) }
  }

  @CheckPolicy((policy) => policy.canCreate())
  @Post(AgentSessionsRoutes.createAppSession.path)
  async createAppSession(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof AgentSessionsRoutes.createAppSession.request,
  ): Promise<typeof AgentSessionsRoutes.createAppSession.response> {
    if (payload.agentSessionType !== "app-private") {
      throw new Error("Session type not supported.")
    }

    const session = await this.agentSessionsService.createAppPrivateSession({
      connectScope: getRequiredConnectScope(request),
      agentId: request.agent.id,
      userId: request.user.id,
    })

    return { data: toAgentSessionDto(session) }
  }
}

function toAgentSessionDto(entity: AgentSession): AgentSessionDto {
  return {
    id: entity.id,
    agentId: entity.agentId,
    type: entity.type,
    createdAt: entity.createdAt.getTime(),
    updatedAt: entity.updatedAt.getTime(),
  }
}
