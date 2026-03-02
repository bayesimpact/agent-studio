import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type {
  EndpointRequestWithAgent,
  EndpointRequestWithConversationAgentSession,
} from "../request.interface"

@Injectable()
export class AgentSessionContextResolver implements ContextResolver {
  readonly resource = "conversationAgentSession" as const

  constructor(
    @InjectRepository(ConversationAgentSession)
    private readonly conversationAgentSessionRepository: Repository<ConversationAgentSession>,
  ) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { agentSessionId?: string }
    }
    const agentSessionId = requestWithParams.params?.agentSessionId

    if (!agentSessionId || agentSessionId === ":agentSessionId") throw new NotFoundException()

    const requestWithAgent = request as EndpointRequestWithAgent
    const agentSession =
      (await this.conversationAgentSessionRepository.findOne({
        where: {
          id: agentSessionId,
          userId: requestWithAgent.user.id,
          organizationId: requestWithAgent.agent.organizationId,
          projectId: requestWithAgent.agent.projectId,
          agentId: requestWithAgent.agent.id,
        },
      })) ?? undefined
    if (!agentSession) throw new NotFoundException()

    const requestWithConversationAgentSession =
      request as EndpointRequestWithConversationAgentSession
    requestWithConversationAgentSession.conversationAgentSession = agentSession
  }
}
