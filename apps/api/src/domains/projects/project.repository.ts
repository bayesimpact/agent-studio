import { Injectable } from "@nestjs/common"
import { In, type Repository } from "typeorm"
import { ALL_ENTITIES } from "@/common/all-entities"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { TransactionService } from "@/common/transaction/transaction.service"
import { Project } from "./project.entity"
import { ProjectModel } from "./project.model"

/** Persisted project row, for when permissions are not resolvable yet. */
export type ProjectRecord = {
  id: string
  organizationId: string
  name: string
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class ProjectRepository {
  constructor(private readonly transactionService: TransactionService) {}

  /** Hydrates the projects of the map keys as models carrying their permissions. */
  async findAllByIds(permissionsByProjectId: Map<string, string[]>): Promise<ProjectModel[]> {
    const projectIds = [...permissionsByProjectId.keys()]
    if (projectIds.length === 0) {
      return []
    }

    const projects = await this.repo().find({
      where: { id: In(projectIds) },
      relations: { featureFlags: true, projectAgentSessionCategories: true },
      order: { createdAt: "DESC" },
    })

    return projects.map((project) =>
      ProjectModel.fromEntity(project, permissionsByProjectId.get(project.id) ?? []),
    )
  }

  /** Same as findAllByIds, restricted to the projects of one organization. */
  async findAllByOrganizationIdAndIds(
    organizationId: string,
    permissionsByProjectId: Map<string, string[]>,
  ): Promise<ProjectModel[]> {
    const projectIds = [...permissionsByProjectId.keys()]
    if (projectIds.length === 0) {
      return []
    }

    const projects = await this.repo().find({
      where: { organizationId, id: In(projectIds) },
      relations: { featureFlags: true, projectAgentSessionCategories: true },
      order: { createdAt: "DESC" },
    })

    return projects.map((project) =>
      ProjectModel.fromEntity(project, permissionsByProjectId.get(project.id) ?? []),
    )
  }

  async createProject(params: { organizationId: string; name: string }): Promise<ProjectRecord> {
    const saved = await this.repo().save(this.repo().create(params))
    return this.toRecord(saved)
  }

  /** Returns null when the project does not exist. */
  async updateName(projectId: string, name: string): Promise<ProjectRecord | null> {
    const project = await this.repo().findOne({ where: { id: projectId } })
    if (!project) {
      return null
    }

    project.name = name
    const saved = await this.repo().save(project)
    return this.toRecord(saved)
  }

  /** Queried through the featureFlags relation to keep this repository on the Project entity only. */
  async isFeatureEnabled({
    projectId,
    feature,
  }: {
    projectId: string
    feature: string
  }): Promise<boolean> {
    return this.repo().exists({
      where: { id: projectId, featureFlags: { featureFlagKey: feature, enabled: true } },
    })
  }

  async softDelete(projectId: string): Promise<void> {
    const entityManager = this.transactionService.getManager()

    for (const entity of ALL_ENTITIES) {
      const hasProjectId = entityManager.connection
        .getMetadata(entity)
        .columns.some((column) => column.propertyName === "projectId")
      if (hasProjectId) {
        await entityManager.softDelete(entity, { projectId })
      }
    }

    await entityManager.softDelete(Project, { id: projectId })
  }

  private toRecord(project: Project): ProjectRecord {
    return {
      id: project.id,
      organizationId: project.organizationId,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }
  }

  private repo(): Repository<Project> {
    return this.transactionService.getManager().getRepository(Project)
  }
}
