import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import { ExtractionAgentSession } from "@/domains/agents/extraction-agent-sessions/extraction-agent-session.entity"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type {
  EndpointRequestWithAgent,
  EndpointRequestWithAgentSession,
} from "../request.interface"

@Injectable()
export class AgentSessionContextResolver implements ContextResolver {
  readonly resource = "agentSession" as const

  constructor(
    @InjectRepository(ConversationAgentSession)
    private readonly conversationAgentSessionRepository: Repository<ConversationAgentSession>,
    @InjectRepository(ExtractionAgentSession)
    private readonly extractionAgentSessionRepository: Repository<ExtractionAgentSession>,
  ) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { agentSessionId?: string }
    }
    const agentSessionId = requestWithParams.params?.agentSessionId

    if (!agentSessionId || agentSessionId === ":agentSessionId") throw new NotFoundException()

    const requestWithAgent = request as EndpointRequestWithAgent

    const where = {
      id: agentSessionId,
      userId: requestWithAgent.user.id,
      organizationId: requestWithAgent.agent.organizationId,
      projectId: requestWithAgent.agent.projectId,
      agentId: requestWithAgent.agent.id,
    }

    let agentSession: ConversationAgentSession | ExtractionAgentSession | undefined
    switch (requestWithAgent.agent.type) {
      case "conversation":
        // The campaign a session belongs to, when any, pins the settings revision the
        // session must keep running on. Loading it here keeps that decision available to
        // every consumer of the session context (streaming included) without those
        // consumers reaching into the review-campaigns domain themselves.
        agentSession =
          (await this.conversationAgentSessionRepository.findOne({
            where,
            relations: { reviewCampaign: true },
          })) ?? undefined
        break
      case "extraction":
        // The settings are loaded with the run: its DTO exposes the revision it ran with.
        agentSession =
          (await this.extractionAgentSessionRepository.findOne({
            where,
            relations: { agentSettings: true },
          })) ?? undefined
        break
      default:
        throw new NotFoundException("Unsupported agent type")
    }

    if (!agentSession) throw new NotFoundException("Agent session not found")

    const requestWithAgentSession = request as EndpointRequestWithAgentSession<typeof agentSession>
    requestWithAgentSession.agentSession = agentSession
  }
}
