import {
  type AgentSessionMessageDto,
  AgentSessionMessagesRoutes,
} from "@caseai-connect/api-contracts"
import { Controller, Get, Req, UseGuards } from "@nestjs/common"
import type { EndpointRequestWithAgentSession } from "@/common/context/request.interface"
import { RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSessionsService } from "../agent-sessions.service"
import { AppPrivateSessionGuard } from "../app-private/app-private-session.guard"
import type { AgentMessage } from "./agent-message.entity"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, AppPrivateSessionGuard)
@RequireContext("organization", "project", "agent", "agentSession")
@Controller()
export class AgentMessagesController {
  constructor(private readonly agentSessionsService: AgentSessionsService) {}

  @CheckPolicy((policy) => policy.canList())
  @Get(AgentSessionMessagesRoutes.listMessages.path)
  async listMessages(
    @Req() request: EndpointRequestWithAgentSession,
  ): Promise<typeof AgentSessionMessagesRoutes.listMessages.response> {
    const agentSessionId = request.agentSession.id
    const messages = await this.agentSessionsService.listMessagesForSession(agentSessionId)
    return { data: messages.map(toDto) }
  }
}

function toDto(message: AgentMessage): AgentSessionMessageDto {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    status: message.status ?? undefined,
    createdAt: message.createdAt.toISOString(),
    startedAt: message.startedAt?.toISOString(),
    completedAt: message.completedAt?.toISOString(),
    toolCalls: message.toolCalls ?? undefined,
    documentId: message.documentId ?? undefined,
  }
}
