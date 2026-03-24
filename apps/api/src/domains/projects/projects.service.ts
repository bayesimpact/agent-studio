import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectMembershipsService } from "./memberships/project-memberships.service"
import { Project } from "./project.entity"

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projectRepository: Repository<Project>,
    private readonly projectMembershipsService: ProjectMembershipsService,
  ) {}

  async createProject(params: {
    organizationId: string
    userId: string
    name: string
  }): Promise<Project> {
    const project = this.projectRepository.create(params)
    await this.projectRepository.save(project)
    await this.projectMembershipsService.createProjectOwnerMembership({
      projectId: project.id,
      userId: params.userId,
    })
    return project
  }

  async listProjects({
    organizationId,
    userId,
  }: {
    organizationId: string
    userId: string
  }): Promise<Project[]> {
    return this.projectRepository.find({
      where: { organizationId, projectMemberships: { userId } },
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
    await this.projectMembershipsService.deleteAllMembershipsForProject(project.id)
  }
}
