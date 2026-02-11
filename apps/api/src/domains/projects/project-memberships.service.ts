import { randomUUID } from "node:crypto"
import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { User } from "@/domains/users/user.entity"
import { ProjectMembership } from "./project-membership.entity"

const PLACEHOLDER_AUTH0_ID_PREFIX = "00000000-0000-0000-0000-"

@Injectable()
export class ProjectMembershipsService {
  constructor(
    @InjectRepository(ProjectMembership)
    private readonly projectMembershipRepository: Repository<ProjectMembership>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
   * For each email:
   * - Finds or creates a user (with placeholder auth0Id if new)
   * - Creates a ProjectMembership with status "sent" and a generated invitationToken
   * - Skips if the user is already a member of the project
   */
  async inviteProjectMembers(projectId: string, emails: string[]): Promise<ProjectMembership[]> {
    const createdMemberships: ProjectMembership[] = []

    for (const email of emails) {
      const normalizedEmail = email.trim().toLowerCase()

      // Find or create user
      let user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      })

      if (!user) {
        // Generate a unique placeholder auth0Id per user to avoid unique constraint violations
        const placeholderAuth0Id = `${PLACEHOLDER_AUTH0_ID_PREFIX}${randomUUID().slice(-12)}`
        user = this.userRepository.create({
          auth0Id: placeholderAuth0Id,
          email: normalizedEmail,
          name: null,
          pictureUrl: null,
        })
        user = await this.userRepository.save(user)
      }

      // Check if membership already exists
      const existingMembership = await this.projectMembershipRepository.findOne({
        where: { projectId, userId: user.id },
      })

      if (existingMembership) {
        continue
      }

      // Create membership
      const membership = this.projectMembershipRepository.create({
        projectId,
        userId: user.id,
        invitationToken: randomUUID(),
        status: "sent",
      })

      const savedMembership = await this.projectMembershipRepository.save(membership)
      savedMembership.user = user
      createdMemberships.push(savedMembership)
    }

    return createdMemberships
  }

  /**
   * Removes a project membership.
   * Validates that the membership belongs to the given project.
   */
  async removeProjectMembership(membershipId: string, projectId: string): Promise<void> {
    const membership = await this.projectMembershipRepository.findOne({
      where: { id: membershipId, projectId },
    })

    if (!membership) {
      throw new NotFoundException(
        `Project membership ${membershipId} not found for project ${projectId}`,
      )
    }

    await this.projectMembershipRepository.remove(membership)
  }
}
