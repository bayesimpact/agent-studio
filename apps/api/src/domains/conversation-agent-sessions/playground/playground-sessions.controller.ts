import {
  type ConversationAgentSessionDto,
  ConversationAgentSessionsRoutes,
} from "@caseai-connect/api-contracts"
import { Controller, Get, Post, Req, UseGuards } from "@nestjs/common"
import type { EndpointRequestWithAgent } from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import { getTraceUrl } from "@/external/langfuse/langfuse-helper"
import type { ConversationAgentSession } from "../conversation-agent-session.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ConversationAgentSessionsService } from "../conversation-agent-sessions.service"
import { PlaygroundSessionGuard } from "./playground-session.guard"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, PlaygroundSessionGuard)
@RequireContext("organization", "project", "agent")
@Controller()
export class PlaygroundSessionsController {
  constructor(
    private readonly conversationAgentSessionsService: ConversationAgentSessionsService,
  ) {}

  @CheckPolicy((policy) => policy.canList())
  @Get(ConversationAgentSessionsRoutes.getAllPlaygroundSessions.path)
  async getAllPlaygroundSessions(
    @Req() request: EndpointRequestWithAgent,
  ): Promise<typeof ConversationAgentSessionsRoutes.getAllPlaygroundSessions.response> {
    const sessions = await this.conversationAgentSessionsService.getAllSessionsForAgent({
      connectScope: getRequiredConnectScope(request),
      agentId: request.agent.id,
      userId: request.user.id,
      type: "playground",
    })

    return { data: sessions.map(toAgentSessionDtoWithTraceUrl) }
  }

  @CheckPolicy((policy) => policy.canCreate())
  @Post(ConversationAgentSessionsRoutes.createPlaygroundSession.path)
  async createPlaygroundSession(
    @Req() request: EndpointRequestWithAgent,
  ): Promise<typeof ConversationAgentSessionsRoutes.createPlaygroundSession.response> {
    const session = await this.conversationAgentSessionsService.createPlaygroundSession({
      connectScope: getRequiredConnectScope(request),
      agentId: request.agent.id,
      userId: request.user.id,
    })

    return { data: toAgentSessionDtoWithTraceUrl(session) }
  }
}

function toAgentSessionDtoWithTraceUrl(
  entity: ConversationAgentSession,
): ConversationAgentSessionDto {
  return {
    id: entity.id,
    agentId: entity.agentId,
    type: entity.type,
    createdAt: entity.createdAt.getTime(),
    updatedAt: entity.updatedAt.getTime(),
    traceUrl: getTraceUrl(entity.traceId),
  }
}
