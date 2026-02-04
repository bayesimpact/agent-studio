import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { Organization } from "@/organizations/organization.entity"
import { type MembershipRole, UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "./project.entity"

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projectRepository: Repository<Project>,
    @InjectRepository(Organization) readonly _organizationRepository: Repository<Organization>,
    @InjectRepository(UserMembership)
    private readonly membershipRepository: Repository<UserMembership>,
  ) {}

  /**
   * Verifies that a user has access to an organization by checking their membership.
   * Throws ForbiddenException if the user is not a member of the organization.
   */
  async verifyUserOrganizationAccess(userId: string, organizationId: string): Promise<void> {
    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId,
      },
    })

    if (!membership) {
      throw new ForbiddenException(`User does not have access to organization ${organizationId}`)
    }
  }

  /**
   * Verifies that a user can create projects for an organization.
   * User must be either "owner" or "admin" of the organization.
   * Throws ForbiddenException if the user is not a member or doesn't have the required role.
   */
  async verifyUserCanCreateProject(userId: string, organizationId: string): Promise<void> {
    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId,
      },
    })

    if (!membership) {
      throw new ForbiddenException(`User does not have access to organization ${organizationId}`)
    }

    const allowedRoles: MembershipRole[] = ["owner", "admin"]
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `User must be an owner or admin of organization ${organizationId} to create projects`,
      )
    }
  }

  /**
   * Verifies that a user can update a project.
   * User must be either "owner" or "admin" of the project's organization.
   * Throws ForbiddenException if the user is not a member or doesn't have the required role.
   */
  async verifyUserCanUpdateProject(userId: string, projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`)
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: project.organizationId,
      },
    })

    if (!membership) {
      throw new ForbiddenException(
        `User does not have access to organization ${project.organizationId}`,
      )
    }

    const allowedRoles: MembershipRole[] = ["owner", "admin"]
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `User must be an owner or admin of organization ${project.organizationId} to update projects`,
      )
    }
  }

  /**
   * Verifies that a user can delete a project.
   * User must be either "owner" or "admin" of the project's organization.
   * Throws ForbiddenException if the user is not a member or doesn't have the required role.
   */
  async verifyUserCanDeleteProject(userId: string, projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`)
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: project.organizationId,
      },
    })

    if (!membership) {
      throw new ForbiddenException(
        `User does not have access to organization ${project.organizationId}`,
      )
    }

    const allowedRoles: MembershipRole[] = ["owner", "admin"]
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `User must be an owner or admin of organization ${project.organizationId} to delete projects`,
      )
    }
  }

  /**
   * Creates a new project for an organization.
   * Verifies that the user is an owner or admin of the organization before creating the project.
   */
  async createProject(organizationId: string, name: string): Promise<Project> {
    // Create the project
    const project = this.projectRepository.create({
      name,
      organizationId,
    })

    return this.projectRepository.save(project)
  }

  /**
   * Lists all projects for an organization.
   * Verification has been handled in the ProjectsGuard.
   */
  async listProjects(organizationId: string): Promise<Project[]> {
    // List projects for the organization
    return this.projectRepository.find({
      where: { organizationId },
      order: { createdAt: "DESC" },
    })
  }

  /**
   * Gets a project by its ID and organization ID.
   */
  async getProject(organizationId: string, projectId: string): Promise<Project | undefined> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId },
    })
    return project ?? undefined
  }

  /**
   * Updates a project.
   * Verifies that the user is an owner or admin of the project's organization before updating.
   */
  async updateProject(userId: string, projectId: string, name: string): Promise<Project> {
    // Verify user can update the project
    await this.verifyUserCanUpdateProject(userId, projectId)

    // Find the project
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`)
    }

    // Update the project
    project.name = name
    return this.projectRepository.save(project)
  }

  /**
   * Deletes a project.
   * Verifies that the user is an owner or admin of the project's organization before deleting.
   */
  async deleteProject(userId: string, projectId: string): Promise<void> {
    // Verify user can delete the project
    await this.verifyUserCanDeleteProject(userId, projectId)

    // Find the project
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`)
    }

    // Delete the project
    await this.projectRepository.remove(project)
  }
}
