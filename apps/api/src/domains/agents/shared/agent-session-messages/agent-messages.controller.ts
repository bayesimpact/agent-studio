import {
  type AgentSessionMessageDto,
  AgentSessionMessagesRoutes,
} from "@caseai-connect/api-contracts"
import { Controller, Post, Req, UseGuards } from "@nestjs/common"
import type { EndpointRequestWithAgentSession } from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { BaseAgentSessionGuard } from "@/domains/agents/base-agent-sessions/base-agent-session.guard"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import type { ConversationAgentSession } from "../../conversation-agent-sessions/conversation-agent-session.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ConversationAgentSessionsService } from "../../conversation-agent-sessions/conversation-agent-sessions.service"
import type { FormAgentSession } from "../../form-agent-sessions/form-agent-session.entity"
import type { AgentMessage } from "./agent-message.entity"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, BaseAgentSessionGuard)
@RequireContext("organization", "project", "agent", "agentSession")
@Controller()
export class AgentMessagesController {
  constructor(
    private readonly conversationAgentSessionsService: ConversationAgentSessionsService,
  ) {}

  @CheckPolicy((policy) => policy.canList())
  @Post(AgentSessionMessagesRoutes.listMessages.path)
  async listMessages(
    @Req() request: EndpointRequestWithAgentSession<ConversationAgentSession | FormAgentSession>,
  ): Promise<typeof AgentSessionMessagesRoutes.listMessages.response> {
    const connectScope = getRequiredConnectScope(request)
    const agentSessionId = request.agentSession.id
    const messages = await this.conversationAgentSessionsService.listMessagesForSession({
      agentSessionId,
      connectScope,
    })
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
    toolCalls: (message.toolCalls as AgentSessionMessageDto["toolCalls"]) ?? undefined,
    documentId: message.documentId ?? undefined,
  }
}
