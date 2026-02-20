import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AgentSession } from "@/domains/agent-sessions/agent-session.entity"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type {
  EndpointRequestWithAgent,
  EndpointRequestWithAgentSession,
} from "../request.interface"

@Injectable()
export class AgentSessionContextResolver implements ContextResolver {
  readonly resource = "agentSession" as const

  constructor(
    @InjectRepository(AgentSession)
    private readonly agentSessionRepository: Repository<AgentSession>,
  ) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { agentSessionId?: string }
    }
    const agentSessionId = requestWithParams.params?.agentSessionId

    if (!agentSessionId || agentSessionId === ":agentSessionId") throw new NotFoundException()

    const requestWithAgent = request as EndpointRequestWithAgent
    const agentSession =
      (await this.agentSessionRepository.findOne({
        where: {
          id: agentSessionId,
          userId: requestWithAgent.user.id,
          organizationId: requestWithAgent.agent.organizationId,
          projectId: requestWithAgent.agent.projectId,
          agentId: requestWithAgent.agent.id,
        },
      })) ?? undefined
    if (!agentSession) throw new NotFoundException()

    const requestWithAgentSession = request as EndpointRequestWithAgentSession
    requestWithAgentSession.agentSession = agentSession
  }
}
