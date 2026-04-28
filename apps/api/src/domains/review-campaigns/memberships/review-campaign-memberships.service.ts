import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { EntityManager, Repository } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DataSource } from "typeorm"
import { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { PLACEHOLDER_AUTH0_ID_PREFIX } from "@/domains/projects/memberships/project-memberships.service"
import { User } from "@/domains/users/user.entity"
import { ReviewCampaign } from "../review-campaign.entity"
import { ReviewCampaignMembership } from "./review-campaign-membership.entity"

@Injectable()
export class ReviewCampaignMembershipsService {
  constructor(
    @InjectRepository(ReviewCampaignMembership)
    private readonly membershipRepository: Repository<ReviewCampaignMembership>,
    private readonly dataSource: DataSource,
  ) {}

  async findByInvitationToken(ticketId: string): Promise<ReviewCampaignMembership | null> {
    return this.membershipRepository.findOne({
      where: { invitationToken: ticketId },
      relations: ["user"],
    })
  }

  /**
   * Accept a review-campaign invitation.
   *
   * Reconciles the placeholder user's auth0Id with the real Auth0 identity, ensures
   * the user has an organization membership on the campaign's organization (role: member),
   * stamps acceptedAt, and returns the updated membership.
   *
   * Safe to call multiple times — subsequent calls after the first acceptance are a no-op.
   */
  async acceptInvitation({
    email,
    ticketId,
    auth0Sub,
  }: {
    email: string
    ticketId: string
    auth0Sub: string
  }): Promise<ReviewCampaignMembership> {
    return this.dataSource.transaction(async (manager) => {
      const membershipRepo = manager.getRepository(ReviewCampaignMembership)
      const userRepo = manager.getRepository(User)
      const orgMembershipRepo = manager.getRepository(OrganizationMembership)
      const campaignRepo = manager.getRepository(ReviewCampaign)

      const membership = await this.findByInvitationToken(ticketId)
      if (!membership) {
        throw new NotFoundException(`No review-campaign invitation found for ticket: ${ticketId}`)
      }
      const { user } = membership
      if (user.email !== email) {
        throw new UnauthorizedException(`No invitation found for email: ${email}`)
      }

      const campaign = await campaignRepo.findOneOrFail({ where: { id: membership.campaignId } })
      await this.ensureOrganizationMembership({
        orgMembershipRepo,
        userId: user.id,
        organizationId: campaign.organizationId,
      })
      await this.ensureProjectMembership({
        manager,
        userId: user.id,
        projectId: campaign.projectId,
      })

      if (user.auth0Id.startsWith(PLACEHOLDER_AUTH0_ID_PREFIX)) {
        user.auth0Id = auth0Sub
        await userRepo.save(user)
      }

      if (membership.acceptedAt) {
        return membership
      }
      membership.acceptedAt = new Date()
      return membershipRepo.save(membership)
    })
  }

  private async ensureOrganizationMembership({
    orgMembershipRepo,
    organizationId,
    userId,
  }: {
    orgMembershipRepo: Repository<OrganizationMembership>
    userId: string
    organizationId: string
  }): Promise<void> {
    const existing = await orgMembershipRepo.findOne({ where: { userId, organizationId } })
    if (existing) return
    const orgMembership = orgMembershipRepo.create({ userId, organizationId, role: "member" })
    await orgMembershipRepo.save(orgMembership)
  }

  private async ensureProjectMembership({
    manager,
    userId,
    projectId,
  }: {
    manager: EntityManager
    userId: string
    projectId: string
  }): Promise<void> {
    const projectMembershipRepo = manager.getRepository(ProjectMembership)
    const existing = await projectMembershipRepo.findOne({ where: { userId, projectId } })
    if (existing) return
    const projectMembership = projectMembershipRepo.create({
      userId,
      projectId,
      role: "member",
      status: "accepted",
      invitationToken: `review-campaign-invitation-${Date.now()}-${userId}`,
    })
    await projectMembershipRepo.save(projectMembership)
  }
}
