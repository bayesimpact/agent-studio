import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { FindOptionsWhere, Repository } from "typeorm"
import { Organization } from "@/domains/organizations/organization.entity"
import { Project } from "./project.entity"

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projectRepository: Repository<Project>,
    @InjectRepository(Organization) readonly _organizationRepository: Repository<Organization>,
  ) {}

  /**
   * Creates a new project for an organization.
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
   * @param options.userId - The ID of the user to filter projects by.
   */
  async listProjects(organizationId: string, options?: { userId?: string }): Promise<Project[]> {
    const whereClause: FindOptionsWhere<Project> = { organizationId }

    if (options?.userId) {
      whereClause.projectMemberships = { userId: options.userId }
    }

    return this.projectRepository.find({
      where: whereClause,
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
   */
  async updateProject(project: Project, name: string): Promise<Project> {
    // Update the project
    project.name = name
    return this.projectRepository.save(project)
  }

  /**
   * Deletes a project.
   */
  async deleteProject(project: Project): Promise<void> {
    await this.projectRepository.remove(project)
  }
}
