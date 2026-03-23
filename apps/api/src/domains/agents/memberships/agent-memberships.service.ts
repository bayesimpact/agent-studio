import { randomUUID } from "node:crypto"
import { Inject, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DataSource } from "typeorm"
import {
  INVITATION_SENDER,
  type InvitationSender,
} from "@/domains/auth/invitation-sender.interface"
import { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { User } from "@/domains/users/user.entity"
import { Agent } from "../agent.entity"
import { AgentMembership } from "./agent-membership.entity"

export const PLACEHOLDER_AUTH0_ID_PREFIX = "00000000-0000-0000-0000-"

@Injectable()
export class AgentMembershipsService {
  constructor(
    @InjectRepository(AgentMembership)
    private readonly agentMembershipRepository: Repository<AgentMembership>,
    @Inject(INVITATION_SENDER)
    private readonly invitationSender: InvitationSender,
    private readonly dataSource: DataSource,
  ) {}

  async findById(membershipId: string): Promise<AgentMembership | null> {
    return this.agentMembershipRepository.findOne({
      where: { id: membershipId },
    })
  }

  async findByInvitationToken(token: string): Promise<AgentMembership | null> {
    return this.agentMembershipRepository.findOne({
      where: { invitationToken: token },
    })
  }

  async listAgentMemberships(agentId: string): Promise<AgentMembership[]> {
    return this.agentMembershipRepository.find({
      where: { agentId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    })
  }

  /**
   * Invites users to an agent by their email addresses.
   * Also ensures each invited user will get a ProjectMembership for the agent's project
   * when they accept the invitation.
   */
  async inviteAgentMembers({
    agentId,
    emails,
    inviterName,
  }: {
    agentId: string
    emails: string[]
    inviterName: string
  }): Promise<AgentMembership[]> {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User)
      const membershipRepo = manager.getRepository(AgentMembership)
      const createdMemberships: AgentMembership[] = []

      for (const email of emails) {
        const membership = await this.inviteAgentMember({
          agentId,
          email,
          inviterName,
          userRepo,
          membershipRepo,
        })
        if (membership) {
          createdMemberships.push(membership)
        }
      }

      return createdMemberships
    })
  }

  /**
   * Accepts an agent membership invitation.
   * Reconciles the placeholder user, creates OrganizationMembership and ProjectMembership
   * if they don't exist yet, then marks the AgentMembership as accepted.
   */
  async acceptInvitation({
    ticketId,
    auth0Sub,
  }: {
    ticketId: string
    auth0Sub: string
  }): Promise<AgentMembership> {
    return this.dataSource.transaction(async (manager) => {
      const membershipRepo = manager.getRepository(AgentMembership)
      const userRepo = manager.getRepository(User)
      const orgMembershipRepo = manager.getRepository(OrganizationMembership)
      const projectMembershipRepo = manager.getRepository(ProjectMembership)
      const agentRepo = manager.getRepository(Agent)

      const membership = await membershipRepo.findOne({
        where: { invitationToken: ticketId },
        relations: ["user"],
      })

      if (!membership) {
        throw new NotFoundException(`Invitation not found for ticket: ${ticketId}`)
      }

      if (membership.status === "accepted") {
        return membership
      }

      // Reconcile placeholder user with real Auth0 identity
      const user = membership.user
      if (user.auth0Id.startsWith(PLACEHOLDER_AUTH0_ID_PREFIX)) {
        user.auth0Id = auth0Sub
        await userRepo.save(user)
      }

      // Load agent to get projectId and organizationId
      const agent = await agentRepo.findOneOrFail({ where: { id: membership.agentId } })

      // Create OrganizationMembership if not exists
      const existingOrgMembership = await orgMembershipRepo.findOne({
        where: { userId: user.id, organizationId: agent.organizationId },
      })
      if (!existingOrgMembership) {
        const orgMembership = orgMembershipRepo.create({
          userId: user.id,
          organizationId: agent.organizationId,
          role: "member",
        })
        await orgMembershipRepo.save(orgMembership)
      }

      // Create ProjectMembership if not exists
      const existingProjectMembership = await projectMembershipRepo.findOne({
        where: { userId: user.id, projectId: agent.projectId },
      })
      if (!existingProjectMembership) {
        const projectMembership = projectMembershipRepo.create({
          userId: user.id,
          projectId: agent.projectId,
          invitationToken: randomUUID(),
          status: "accepted",
          role: "admin",
        })
        await projectMembershipRepo.save(projectMembership)
      }

      membership.status = "accepted"
      return membershipRepo.save(membership)
    })
  }

  /**
   * Removes an agent membership.
   * If the associated user is a placeholder (never accepted), also removes the user.
   */
  async removeAgentMembership({
    membershipId,
    agentId,
  }: {
    membershipId: string
    agentId: string
  }): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const membershipRepo = manager.getRepository(AgentMembership)
      const userRepo = manager.getRepository(User)

      const membership = await membershipRepo.findOne({
        where: { id: membershipId, agentId },
        relations: ["user"],
      })

      if (!membership) return

      const { user } = membership

      await membershipRepo.delete({ id: membershipId, agentId })

      if (user.auth0Id.startsWith(PLACEHOLDER_AUTH0_ID_PREFIX)) {
        await userRepo.delete({ id: user.id })
      }
    })
  }

  private async inviteAgentMember({
    agentId,
    email,
    inviterName,
    userRepo,
    membershipRepo,
  }: {
    agentId: string
    email: string
    inviterName: string
    userRepo: Repository<User>
    membershipRepo: Repository<AgentMembership>
  }): Promise<AgentMembership | null> {
    const normalizedEmail = email.trim().toLowerCase()

    let user = await userRepo.findOne({ where: { email: normalizedEmail } })

    if (!user) {
      const placeholderAuth0Id = `${PLACEHOLDER_AUTH0_ID_PREFIX}${randomUUID().slice(-12)}`
      user = userRepo.create({
        auth0Id: placeholderAuth0Id,
        email: normalizedEmail,
        name: null,
        pictureUrl: null,
      })
      user = await userRepo.save(user)
    }

    const existingMembership = await membershipRepo.findOne({
      where: { agentId, userId: user.id },
    })

    if (existingMembership) {
      return null
    }

    const { ticketId } = await this.invitationSender.sendInvitation({
      inviteeEmail: normalizedEmail,
      inviterName,
    })

    const membership = membershipRepo.create({
      agentId,
      userId: user.id,
      invitationToken: ticketId,
      status: "sent",
      role: "member",
    })

    const savedMembership = await membershipRepo.save(membership)
    savedMembership.user = user

    return savedMembership
  }
}
