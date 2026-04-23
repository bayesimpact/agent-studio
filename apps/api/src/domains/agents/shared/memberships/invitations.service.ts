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
import { ReviewCampaignMembership } from "@/domains/review-campaigns/memberships/review-campaign-membership.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ReviewCampaignMembershipsService } from "@/domains/review-campaigns/memberships/review-campaign-memberships.service"

type ResolvedInvitation =
  | { type: "agent"; membership: AgentMembership }
  | { type: "project"; membership: ProjectMembership }
  | { type: "reviewCampaign"; membership: ReviewCampaignMembership }

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(AgentMembership)
    private readonly agentMembershipRepository: Repository<AgentMembership>,
    @InjectRepository(ProjectMembership)
    private readonly projectMembershipRepository: Repository<ProjectMembership>,
    @InjectRepository(ReviewCampaignMembership)
    private readonly reviewCampaignMembershipRepository: Repository<ReviewCampaignMembership>,
    private readonly agentMembershipsService: AgentMembershipsService,
    private readonly projectMembershipsService: ProjectMembershipsService,
    private readonly reviewCampaignMembershipsService: ReviewCampaignMembershipsService,
    private readonly auth0UserInfoService: Auth0UserInfoService,
  ) {}

  async resolveInvitation(ticketId: string): Promise<ResolvedInvitation> {
    const agentMembership = await this.agentMembershipRepository.findOne({
      where: { invitationToken: ticketId },
      select: { id: true },
    })
    if (agentMembership) return { type: "agent", membership: agentMembership }

    const projectMembership = await this.projectMembershipRepository.findOne({
      where: { invitationToken: ticketId },
      select: { id: true },
    })
    if (projectMembership) return { type: "project", membership: projectMembership }

    const reviewCampaignMembership = await this.reviewCampaignMembershipRepository.findOne({
      where: { invitationToken: ticketId },
      select: { id: true },
    })
    if (reviewCampaignMembership) {
      return { type: "reviewCampaign", membership: reviewCampaignMembership }
    }

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
  }): Promise<{ type: ResolvedInvitation["type"]; userId: string }> {
    const invitation = await this.resolveInvitation(ticketId)

    const { email } = await this.auth0UserInfoService.getUserInfo(accessToken)
    if (!email) throw new NotFoundException(`No email found for auth0Sub: ${auth0Sub}`)

    switch (invitation.type) {
      case "agent": {
        const accepted = await this.agentMembershipsService.acceptInvitation({
          ticketId,
          auth0Sub,
          email,
        })
        return { type: "agent", userId: accepted.userId }
      }
      case "project": {
        const accepted = await this.projectMembershipsService.acceptInvitation({
          ticketId,
          auth0Sub,
          email,
        })
        return { type: "project", userId: accepted.userId }
      }
      case "reviewCampaign": {
        const accepted = await this.reviewCampaignMembershipsService.acceptInvitation({
          ticketId,
          auth0Sub,
          email,
        })
        return { type: "reviewCampaign", userId: accepted.userId }
      }
    }
  }
}
