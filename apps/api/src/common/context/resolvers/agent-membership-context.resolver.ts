import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AgentMembership } from "@/domains/agents/memberships/agent-membership.entity"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type { EndpointRequestWithAgentMembership } from "../request.interface"

@Injectable()
export class AgentMembershipContextResolver implements ContextResolver {
  readonly resource = "agentMembership" as const

  constructor(
    @InjectRepository(AgentMembership)
    private readonly agentMembershipRepository: Repository<AgentMembership>,
  ) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { agentMembershipId?: string }
    }
    const agentMembershipId = requestWithParams.params?.agentMembershipId

    if (!agentMembershipId || agentMembershipId === ":agentMembershipId") {
      throw new NotFoundException()
    }

    const requestWithAgentMembership = request as EndpointRequestWithAgentMembership
    const agentMembership =
      (await this.agentMembershipRepository.findOne({
        where: {
          id: agentMembershipId,
          agentId: requestWithParams.params?.agentId,
        },
      })) ?? undefined
    if (!agentMembership) throw new NotFoundException()

    requestWithAgentMembership.memberAgentMembership = agentMembership
  }
}
