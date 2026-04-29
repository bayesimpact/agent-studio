import { randomUUID } from "node:crypto"
import { Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DataSource } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentMembershipsService } from "@/domains/agents/memberships/agent-memberships.service"
import {
  INVITATION_SENDER,
  type InvitationSender,
} from "@/domains/auth/invitation-sender.interface"
import { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { User } from "@/domains/users/user.entity"
import { Project } from "../project.entity"
import { ProjectMembership } from "./project-membership.entity"

export const PLACEHOLDER_AUTH0_ID_PREFIX = "00000000-0000-0000-0000-"

@Injectable()
export class ProjectMembershipsService {
  constructor(
    @InjectRepository(ProjectMembership)
    private readonly projectMembershipRepository: Repository<ProjectMembership>,
    @Inject(INVITATION_SENDER)
    private readonly invitationSender: InvitationSender,
    private readonly dataSource: DataSource,
    private readonly agentMembershipsService: AgentMembershipsService,
  ) {}

  async findById(membershipId: string): Promise<ProjectMembership | null> {
    return this.projectMembershipRepository.findOne({
      where: { id: membershipId },
      relations: ["user"],
    })
  }

  async findByInvitationToken(invitationToken: string): Promise<ProjectMembership> {
    const membership = await this.projectMembershipRepository.findOne({
      where: { invitationToken },
      relations: ["user"],
    })
    if (!membership) {
      throw new NotFoundException(`Invitation not found for ticket: ${invitationToken}`)
    }
    return membership
  }

  async listProjectMemberships(projectId: string): Promise<ProjectMembership[]> {
    return this.projectMembershipRepository.find({
      where: { projectId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    })
  }

  async listMemberAgents(params: { projectId: string; userId: string }) {
    return this.agentMembershipsService.listProjectMemberAgents(params)
  }

  async createProjectOwnerMembership({
    projectId,
    userId,
  }: {
    projectId: string
    userId: string
  }): Promise<ProjectMembership> {
    const membership = this.projectMembershipRepository.create({
      projectId,
      userId,
      role: "owner",
      status: "accepted",
      invitationToken: `create_project_owner_membership-${randomUUID()}`,
    })
    return this.projectMembershipRepository.save(membership)
  }

  /**
   * Invites users to a project by their email addresses.
   * Runs inside a SQL transaction — if the Auth0 invitation fails, all DB changes are rolled back.
   *
   * For each email:
   * - Finds or creates a user (with placeholder auth0Id if new)
   * - Sends an Auth0 invitation and retrieves the ticket_id
   * - Creates a ProjectMembership with status "sent" and the Auth0 ticket_id as invitationToken
   * - Skips if the user is already a member of the project
   */
  async inviteProjectMembers({
    projectId,
    emails,
    inviterName,
  }: {
    projectId: string
    emails: string[]
    inviterName: string
  }): Promise<ProjectMembership[]> {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User)
      const membershipRepo = manager.getRepository(ProjectMembership)
      const createdMemberships: ProjectMembership[] = []

      for (const email of emails) {
        const membership = await this.inviteProjectMember({
          projectId,
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

  private async inviteProjectMember({
    projectId,
    email,
    inviterName,
    userRepo,
    membershipRepo,
  }: {
    projectId: string
    email: string
    inviterName: string
    userRepo: Repository<User>
    membershipRepo: Repository<ProjectMembership>
  }): Promise<ProjectMembership | null> {
    const normalizedEmail = email.trim().toLowerCase()

    const user = await this.findOrCreatePlaceholderUser({ userRepo, email: normalizedEmail })

    // Check if membership already exists — upgrade to admin if currently member
    const existingMembership = await membershipRepo.findOne({
      where: { projectId, userId: user.id },
    })

    if (existingMembership) {
      if (existingMembership.role !== "admin") {
        existingMembership.role = "admin"
        await membershipRepo.save(existingMembership)
        await this.agentMembershipsService.createAdminAgentMembershipsForUserInProject({
          manager: membershipRepo.manager,
          userId: user.id,
          projectId,
        })
      }
      return null
    }

    // Send Auth0 invitation — if this throws, the entire transaction rolls back
    const { ticketId } = await this.invitationSender.sendInvitation({
      inviteeEmail: normalizedEmail,
      inviterName,
    })

    // Create membership with the Auth0 ticket_id as the invitation token
    const membership = membershipRepo.create({
      projectId,
      userId: user.id,
      invitationToken: ticketId,
      status: "sent",
      role: "admin",
    })

    const savedMembership = await membershipRepo.save(membership)
    savedMembership.user = user

    return savedMembership
  }

  /**
   * Accepts a project membership invitation.
   * Finds the membership by its invitation token (Auth0 ticket_id), reconciles the
   * placeholder user's auth0Id with the real Auth0 identity, and marks the membership as accepted.
   *
   * This must be called BEFORE /me (UserGuard.findOrCreate) so that the placeholder user
   * gets the real auth0Id first. Then /me will find this user instead of creating a duplicate.
   *
   * @param ticketId The Auth0 ticket_id stored as the membership's invitationToken
   * @param auth0Sub The real Auth0 user ID from the JWT
   */
  async acceptInvitation({
    email,
    ticketId,
    auth0Sub,
  }: {
    email: string
    ticketId: string
    auth0Sub: string
  }): Promise<ProjectMembership> {
    return this.dataSource.transaction(async (manager) => {
      const projectMembershipRepo = manager.getRepository(ProjectMembership)
      const userRepo = manager.getRepository(User)
      const orgMembershipRepo = manager.getRepository(OrganizationMembership)
      const projectRepo = manager.getRepository(Project)

      const projectMembership = await this.findByInvitationToken(ticketId)

      const { user } = projectMembership

      if (user.email !== email) {
        // 401
        throw new UnauthorizedException(`No invitation found for email: ${email}`)
      }

      const project = await projectRepo.findOneOrFail({
        where: { id: projectMembership.projectId },
      })
      await this.ensureOrganizationMembership({
        orgMembershipRepo,
        userId: user.id,
        organizationId: project.organizationId,
      })

      // Also create admin agent memberships for this user in all agents of the project
      await this.agentMembershipsService.createAdminAgentMembershipsForUserInProject({
        manager,
        userId: user.id,
        projectId: project.id,
      })

      // Reconcile the placeholder user's auth0Id with the real Auth0 identity
      if (user.auth0Id.startsWith(PLACEHOLDER_AUTH0_ID_PREFIX)) {
        user.auth0Id = auth0Sub
        await userRepo.save(user)
      }

      if (projectMembership.status === "accepted") {
        return projectMembership
      }
      projectMembership.status = "accepted"
      return projectMembershipRepo.save(projectMembership)
    })
  }

  /**
   * Invites a single user to a project by email.
   * Returns the created membership, or null if the user is already a member.
   */
  private async findOrCreatePlaceholderUser({
    email,
    userRepo,
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
    if (existing) {
      if (existing.role === "member") {
        existing.role = "admin"
        await orgMembershipRepo.save(existing)
      }
      return
    }

    const orgMembership = orgMembershipRepo.create({ userId, organizationId, role: "admin" })
    await orgMembershipRepo.save(orgMembership)
  }

  /**
   * Removes a project membership.
   * If the associated user is a placeholder (never accepted the invitation),
   * also deletes the placeholder user to avoid orphaned records.
   */
  async removeProjectMembership({
    userId,
    membershipId,
    projectId,
  }: {
    userId: string
    membershipId: string
    projectId: string
  }): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const membershipRepo = manager.getRepository(ProjectMembership)
      const userRepo = manager.getRepository(User)

      const membership = await this.findById(membershipId)
      if (!membership) return

      const { user } = membership

      if (user.id === userId) {
        throw new Error("Cannot remove yourself from the project")
      }

      if (membership.role === "owner") {
        throw new Error("Cannot remove owner from the project")
      }

      // Also delete all agent memberships for this user in the project
      await this.agentMembershipsService.deleteAgentMembershipsForUserInProject({
        manager,
        userId: user.id,
        projectId,
      })

      await membershipRepo.delete({ id: membershipId, projectId })

      // If the user is a placeholder (never signed up), clean them up
      if (user.auth0Id.startsWith(PLACEHOLDER_AUTH0_ID_PREFIX)) {
        await userRepo.delete({ id: user.id })
      }
    })
  }
}
