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
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
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
   * Creates a new project for an organization.
   * Verifies that the user is an owner or admin of the organization before creating the project.
   */
  async createProject(userId: string, organizationId: string, name: string): Promise<Project> {
    // Verify user is owner or admin of the organization
    await this.verifyUserCanCreateProject(userId, organizationId)

    // Verify organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    })

    if (!organization) {
      throw new NotFoundException(`Organization with id ${organizationId} not found`)
    }

    // Create the project
    const project = this.projectRepository.create({
      name,
      organizationId,
      organization,
    })

    return this.projectRepository.save(project)
  }

  /**
   * Lists all projects for an organization.
   * Verifies that the user has access to the organization before listing projects.
   */
  async listProjects(userId: string, organizationId: string): Promise<Project[]> {
    // Verify user has access to the organization
    await this.verifyUserOrganizationAccess(userId, organizationId)

    // List projects for the organization
    return this.projectRepository.find({
      where: { organizationId },
      order: { createdAt: "DESC" },
    })
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
}
