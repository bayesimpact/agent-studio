import { type AgentMembershipDto, AgentMembershipRoutes } from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Post, Req, UseGuards } from "@nestjs/common"
import type {
  EndpointRequestWithAgent,
  EndpointRequestWithAgentMembership,
} from "@/common/context/request.interface"
import { AddContext, RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import type { AgentMembership } from "./agent-membership.entity"
import { AgentMembershipsGuard } from "./agent-memberships.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentMembershipsService } from "./agent-memberships.service"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, AgentMembershipsGuard)
@RequireContext("organization", "project", "agent")
@Controller()
export class AgentMembershipsController {
  constructor(private readonly agentMembershipsService: AgentMembershipsService) {}

  @Get(AgentMembershipRoutes.getAll.path)
  @CheckPolicy((policy) => policy.canList())
  async getAll(
    @Req() request: EndpointRequestWithAgent,
  ): Promise<typeof AgentMembershipRoutes.getAll.response> {
    const { agent } = request
    console.warn("AJ: agent", agent)

    const memberships = await this.agentMembershipsService.listAgentMemberships(agent.id)

    return { data: memberships.map(toDto) }
  }

  @Post(AgentMembershipRoutes.createOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  async inviteAgentMembers(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof AgentMembershipRoutes.createOne.request,
  ): Promise<typeof AgentMembershipRoutes.createOne.response> {
    const { agent, user } = request

    const memberships = await this.agentMembershipsService.inviteAgentMembers({
      agentId: agent.id,
      emails: payload.emails,
      inviterName: user.name ?? user.email,
    })

    return { data: memberships.map(toDto) }
  }

  @Delete(AgentMembershipRoutes.deleteOne.path)
  @CheckPolicy((policy) => policy.canDelete())
  @AddContext("agentMembership")
  async removeAgentMembership(
    @Req() request: EndpointRequestWithAgentMembership,
  ): Promise<typeof AgentMembershipRoutes.deleteOne.response> {
    const { agent, agentMembership } = request

    await this.agentMembershipsService.removeAgentMembership({
      userId: request.user.id,
      membershipId: agentMembership.id,
      agentId: agent.id,
    })

    return { data: { success: true } }
  }
}

function toDto(entity: AgentMembership): AgentMembershipDto {
  return {
    id: entity.id,
    agentId: entity.agentId,
    userId: entity.userId,
    userName: entity.user.name,
    userEmail: entity.user.email,
    role: entity.role,
    status: entity.status,
    createdAt: entity.createdAt.getTime(),
  }
}
