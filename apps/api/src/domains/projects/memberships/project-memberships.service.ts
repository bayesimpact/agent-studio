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
  ) {}

  /**
   * Finds a project membership by its ID.
   */
  async findById(membershipId: string): Promise<ProjectMembership | null> {
    return this.projectMembershipRepository.findOne({
      where: { id: membershipId },
    })
  }

  /**
   * Find a project membership by projectId and userId.
   */
  async findByProjectIdAndUserId({
    projectId,
    userId,
  }: {
    projectId: string
    userId: string
  }): Promise<ProjectMembership | null> {
    return this.projectMembershipRepository.findOne({
      where: { projectId, userId },
    })
  }

  /**
   * Lists all project memberships for a project, with user relations eagerly loaded.
   */
  async listProjectMemberships(projectId: string): Promise<ProjectMembership[]> {
    return this.projectMembershipRepository.find({
      where: { projectId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    })
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
    ticketId,
    auth0Sub,
  }: {
    ticketId: string
    auth0Sub: string
  }): Promise<ProjectMembership> {
    return this.dataSource.transaction(async (manager) => {
      const membershipRepo = manager.getRepository(ProjectMembership)
      const userRepo = manager.getRepository(User)
      const orgMembershipRepo = manager.getRepository(OrganizationMembership)
      const projectRepo = manager.getRepository(Project)

      // Find the membership by invitation token (ticket_id)
      const membership = await membershipRepo.findOne({
        where: { invitationToken: ticketId },
        relations: ["user"],
      })

      if (!membership) {
        throw new NotFoundException(`Invitation not found for ticket: ${ticketId}`)
      }

      if (membership.status === "accepted") {
        // Already accepted — return as-is
        return membership
      }

      // Reconcile the placeholder user's auth0Id with the real Auth0 identity.
      // User profile info (name, email, picture) will be filled in by UserGuard.findOrCreate
      // when /me is called right after this.
      const user = membership.user
      if (user.auth0Id.startsWith(PLACEHOLDER_AUTH0_ID_PREFIX)) {
        user.auth0Id = auth0Sub
        await userRepo.save(user)
      }

      // Create an organization membership for the user (as "member") if one doesn't exist yet
      const project = await projectRepo.findOneOrFail({ where: { id: membership.projectId } })
      const existingOrgMembership = await orgMembershipRepo.findOne({
        where: { userId: user.id, organizationId: project.organizationId },
      })
      if (!existingOrgMembership) {
        const orgMembership = orgMembershipRepo.create({
          userId: user.id,
          organizationId: project.organizationId,
          role: "member",
        })
        await orgMembershipRepo.save(orgMembership)
      }

      // Mark the membership as accepted
      membership.status = "accepted"
      return membershipRepo.save(membership)
    })
  }

  /**
   * Invites a single user to a project by email.
   * Returns the created membership, or null if the user is already a member.
   */
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

    // Find or create user (using transactional manager)
    let user = await userRepo.findOne({
      where: { email: normalizedEmail },
    })

    if (!user) {
      // Generate a unique placeholder auth0Id per user to avoid unique constraint violations
      const placeholderAuth0Id = `${PLACEHOLDER_AUTH0_ID_PREFIX}${randomUUID().slice(-12)}`
      user = userRepo.create({
        auth0Id: placeholderAuth0Id,
        email: normalizedEmail,
        name: null,
        pictureUrl: null,
      })
      user = await userRepo.save(user)
    }

    // Check if membership already exists
    const existingMembership = await membershipRepo.findOne({
      where: { projectId, userId: user.id },
    })

    if (existingMembership) {
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
    })

    const savedMembership = await membershipRepo.save(membership)
    savedMembership.user = user

    return savedMembership
  }

  /**
   * Removes a project membership.
   * If the associated user is a placeholder (never accepted the invitation),
   * also deletes the placeholder user to avoid orphaned records.
   */
  async removeProjectMembership({
    membershipId,
    projectId,
  }: {
    membershipId: string
    projectId: string
  }): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const membershipRepo = manager.getRepository(ProjectMembership)
      const userRepo = manager.getRepository(User)

      const membership = await membershipRepo.findOne({
        where: { id: membershipId, projectId },
        relations: ["user"],
      })

      if (!membership) return

      const { user } = membership

      // Delete the membership first (foreign key constraint)
      await membershipRepo.delete({ id: membershipId, projectId })

      // If the user is a placeholder (never signed up), clean them up
      if (user.auth0Id.startsWith(PLACEHOLDER_AUTH0_ID_PREFIX)) {
        await userRepo.delete({ id: user.id })
      }
    })
  }
}
