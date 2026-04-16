import { randomUUID } from "node:crypto"
import { Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { EntityManager, Repository } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DataSource, In } from "typeorm"
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
      relations: ["user", "agent"],
    })
  }

  async findByInvitationToken(invitationToken: string): Promise<AgentMembership> {
    const membership = await this.agentMembershipRepository.findOne({
      where: { invitationToken },
      relations: ["user"],
    })
    if (!membership) {
      throw new NotFoundException(`Invitation not found for ticket: ${invitationToken}`)
    }
    return membership
  }

  async listAgentMemberships(agentId: string): Promise<AgentMembership[]> {
    return this.agentMembershipRepository.find({
      where: { agentId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    })
  }

  async createAgentOwnerMembership(params: {
    agentId: string
    userId: string
  }): Promise<AgentMembership> {
    const membership = this.agentMembershipRepository.create({
      agentId: params.agentId,
      userId: params.userId,
      role: "owner",
      status: "accepted",
      invitationToken: `new_agent_no_invitation_token-${randomUUID()}`,
    })
    return this.agentMembershipRepository.save(membership)
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

    const user = await this.findOrCreatePlaceholderUser({ userRepo, email: normalizedEmail })

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

    const newMembership = membershipRepo.create({
      agentId,
      userId: user.id,
      invitationToken: ticketId,
      status: "sent",
      role: "member",
    })
    const savedMembership = await membershipRepo.save(newMembership)
    savedMembership.user = user
    return savedMembership
  }

  /**
   * Accepts an agent membership invitation.
   * Reconciles the placeholder user, creates OrganizationMembership and ProjectMembership
   * if they don't exist yet, then marks the AgentMembership as accepted.
   */
  async acceptInvitation({
    ticketId,
    auth0Sub,
    email,
  }: {
    email: string
    ticketId: string
    auth0Sub: string
  }): Promise<AgentMembership> {
    return this.dataSource.transaction(async (manager) => {
      const membershipRepo = manager.getRepository(AgentMembership)
      const userRepo = manager.getRepository(User)
      const orgMembershipRepo = manager.getRepository(OrganizationMembership)
      const projectMembershipRepo = manager.getRepository(ProjectMembership)
      const agentRepo = manager.getRepository(Agent)

      const membership = await this.findByInvitationToken(ticketId)
      const { user } = membership

      if (user.email !== email) {
        // 401
        throw new UnauthorizedException(`No invitation found for email: ${email}`)
      }

      const agent = await agentRepo.findOneOrFail({ where: { id: membership.agentId } })
      await this.ensureOrganizationMembership({
        orgMembershipRepo,
        userId: user.id,
        organizationId: agent.organizationId,
      })
      await this.ensureProjectMembership({
        projectMembershipRepo,
        userId: user.id,
        projectId: agent.projectId,
      })

      // Reconcile placeholder user with real Auth0 identity
      if (user.auth0Id.startsWith(PLACEHOLDER_AUTH0_ID_PREFIX)) {
        user.auth0Id = auth0Sub
        await userRepo.save(user)
      }

      if (membership.status === "accepted") {
        return membership
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
    userId,
    membershipId,
    agentId,
  }: {
    userId: string
    membershipId: string
    agentId: string
  }): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const membershipRepo = manager.getRepository(AgentMembership)
      const userRepo = manager.getRepository(User)
      const projectMembershipRepo = manager.getRepository(ProjectMembership)
      const organizationMembershipRepo = manager.getRepository(OrganizationMembership)

      // when calling findById, we use another DB transaction, it's not ideal but it's ok for this use case
      const membership = await this.findById(membershipId)
      if (!membership) return

      if (membership.user.id === userId) {
        throw new Error("Cannot remove yourself from the agent")
      }
      if (membership.role === "owner") {
        throw new Error("Cannot remove owner from the agent")
      }

      await membershipRepo.delete({ id: membershipId, agentId })

      const memberships = await membershipRepo.find({
        where: { id: membershipId, agentId },
        relations: ["user"],
      })

      if (memberships.length === 0) {
        // If the user has no more memberships for this agent, also remove their ProjectMembership and OrganizationMembership related to this agent's project and organization
        await projectMembershipRepo.delete({
          userId: membership.user.id,
          projectId: membership.agent.projectId,
        })
        await organizationMembershipRepo.delete({
          userId: membership.user.id,
          organizationId: membership.agent.organizationId,
        })
      }

      if (membership.user.auth0Id.startsWith(PLACEHOLDER_AUTH0_ID_PREFIX)) {
        // If the user is a placeholder (never signed up), clean them up
        await userRepo.delete({ id: membership.user.id })
      }
    })
  }

  async createAdminAgentMembershipsForUserInProject({
    manager,
    userId,
    projectId,
  }: {
    manager: EntityManager
    userId: string
    projectId: string
  }): Promise<void> {
    const agents = await manager.find(Agent, {
      where: { projectId },
      select: { id: true },
    })

    for (const agent of agents) {
      const existing = await manager.findOne(AgentMembership, {
        where: { agentId: agent.id, userId },
      })
      if (existing) {
        if (existing.role !== "admin") {
          existing.role = "admin"
          await manager.save(AgentMembership, existing)
        }
        continue
      }

      const membership = manager.create(AgentMembership, {
        agentId: agent.id,
        userId,
        role: "admin",
        status: "accepted",
        invitationToken: `project_invite-${randomUUID()}`,
      })
      await manager.save(AgentMembership, membership)
    }
  }

  async createAdminAgentMembershipsForProjectAdmins({
    agentId,
    projectId,
    excludeUserId,
  }: {
    agentId: string
    projectId: string
    excludeUserId: string
  }): Promise<void> {
    const projectMemberships = await this.dataSource.getRepository(ProjectMembership).find({
      where: [
        { projectId, role: "admin" },
        { projectId, role: "owner" },
      ],
    })

    for (const projectMembership of projectMemberships) {
      if (projectMembership.userId === excludeUserId) continue

      const existing = await this.agentMembershipRepository.findOne({
        where: { agentId, userId: projectMembership.userId },
      })
      if (existing) continue

      const membership = this.agentMembershipRepository.create({
        agentId,
        userId: projectMembership.userId,
        role: "admin",
        status: "accepted",
        invitationToken: `project_admin_propagation-${randomUUID()}`,
      })
      await this.agentMembershipRepository.save(membership)
    }
  }

  async deleteAgentMembershipsForUserInProject({
    manager,
    userId,
    projectId,
  }: {
    manager: EntityManager
    userId: string
    projectId: string
  }): Promise<void> {
    const agents = await manager.find(Agent, { where: { projectId }, select: { id: true } })
    if (agents.length === 0) return

    const agentIds = agents.map((agent) => agent.id)
    await manager.delete(AgentMembership, { agentId: In(agentIds), userId })
  }

  private async findOrCreatePlaceholderUser({
    userRepo,
    email,
  }: {
    userRepo: Repository<User>
    email: string
  }): Promise<User> {
    const existing = await userRepo.findOne({ where: { email } })
    if (existing) return existing

    const placeholderAuth0Id = `${PLACEHOLDER_AUTH0_ID_PREFIX}${randomUUID().slice(-12)}`
    const user = userRepo.create({
      auth0Id: placeholderAuth0Id,
      email,
      name: null,
      pictureUrl: null,
    })
    return userRepo.save(user)
  }

  private async ensureProjectMembership({
    projectId,
    projectMembershipRepo,
    userId,
  }: {
    projectMembershipRepo: Repository<ProjectMembership>
    userId: string
    projectId: string
  }): Promise<void> {
    const existing = await projectMembershipRepo.findOne({ where: { userId, projectId } })
    if (existing) return

    const projectMembership = projectMembershipRepo.create({
      userId,
      projectId,
      invitationToken: randomUUID(),
      status: "accepted",
      role: "member",
    })
    await projectMembershipRepo.save(projectMembership)
  }

  private async ensureOrganizationMembership({
    orgMembershipRepo,
    userId,
    organizationId,
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
}
