import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AgentMembership } from "@/domains/agents/memberships/agent-membership.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentMembershipsService } from "@/domains/agents/memberships/agent-memberships.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { Auth0UserInfoService } from "@/domains/auth/auth0-userinfo.service"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectMembershipsService } from "@/domains/projects/memberships/project-memberships.service"

type InvitationType = "agent" | "project"

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(AgentMembership)
    private readonly agentMembershipRepository: Repository<AgentMembership>,
    @InjectRepository(ProjectMembership)
    private readonly projectMembershipRepository: Repository<ProjectMembership>,
    private readonly agentMembershipsService: AgentMembershipsService,
    private readonly projectMembershipsService: ProjectMembershipsService,
    private readonly auth0UserInfoService: Auth0UserInfoService,
  ) {}

  async resolveInvitationType(ticketId: string): Promise<InvitationType> {
    const agentMembership = await this.agentMembershipRepository.findOne({
      where: { invitationToken: ticketId },
      select: { id: true },
    })
    if (agentMembership) return "agent"

    const projectMembership = await this.projectMembershipRepository.findOne({
      where: { invitationToken: ticketId },
      select: { id: true },
    })
    if (projectMembership) return "project"

    throw new NotFoundException(`No invitation found for ticket: ${ticketId}`)
  }

  async acceptInvitation({
    ticketId,
    accessToken,
    auth0Sub,
  }: {
    accessToken: string
    ticketId: string
    auth0Sub: string
  }): Promise<void> {
    const type = await this.resolveInvitationType(ticketId)

    const { email } = await this.auth0UserInfoService.getUserInfo(accessToken)
    if (!email) throw new NotFoundException(`No email found for auth0Sub: ${auth0Sub}`)

    if (type === "agent") {
      await this.agentMembershipsService.acceptInvitation({ ticketId, auth0Sub, email })
    } else {
      await this.projectMembershipsService.acceptInvitation({ ticketId, auth0Sub, email })
    }
  }
}
