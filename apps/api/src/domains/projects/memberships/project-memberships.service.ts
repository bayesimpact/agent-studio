import { randomUUID } from "node:crypto"
import { Inject, Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DataSource } from "typeorm"
import {
  INVITATION_SENDER,
  type InvitationSender,
} from "@/domains/auth/invitation-sender.interface"
import { User } from "@/domains/users/user.entity"
import { ProjectMembership } from "./project-membership.entity"

const PLACEHOLDER_AUTH0_ID_PREFIX = "00000000-0000-0000-0000-"

@Injectable()
export class ProjectMembershipsService {
  constructor(
    @InjectRepository(ProjectMembership)
    private readonly projectMembershipRepository: Repository<ProjectMembership>,
    @InjectRepository(User) readonly _userRepository: Repository<User>,
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
   * - Creates a ProjectMembership with status "sent" and a generated invitationToken
   * - Sends an Auth0 invitation with the invitationToken as metadata
   * - Skips if the user is already a member of the project
   */
  async inviteProjectMembers(
    projectId: string,
    emails: string[],
    inviterName: string,
  ): Promise<ProjectMembership[]> {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User)
      const membershipRepo = manager.getRepository(ProjectMembership)
      const createdMemberships: ProjectMembership[] = []

      for (const email of emails) {
        const membership = await this.inviteProjectMember(
          projectId,
          email,
          inviterName,
          userRepo,
          membershipRepo,
        )
        if (membership) {
          createdMemberships.push(membership)
        }
      }

      return createdMemberships
    })
  }

  /**
   * Invites a single user to a project by email.
   * Returns the created membership, or null if the user is already a member.
   */
  private async inviteProjectMember(
    projectId: string,
    email: string,
    inviterName: string,
    userRepo: Repository<User>,
    membershipRepo: Repository<ProjectMembership>,
  ): Promise<ProjectMembership | null> {
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

    // Create membership (using transactional manager)
    const membership = membershipRepo.create({
      projectId,
      userId: user.id,
      invitationToken: randomUUID(),
      status: "sent",
    })

    const savedMembership = await membershipRepo.save(membership)
    savedMembership.user = user

    // Send Auth0 invitation — if this throws, the entire transaction rolls back
    await this.invitationSender.sendInvitation({
      inviteeEmail: normalizedEmail,
      inviterName,
      metadata: { invitationToken: savedMembership.invitationToken },
    })

    return savedMembership
  }

  /**
   * Removes a project membership.
   */
  async removeProjectMembership(membershipId: string, projectId: string): Promise<void> {
    await this.projectMembershipRepository.delete({ id: membershipId, projectId })
  }
}
