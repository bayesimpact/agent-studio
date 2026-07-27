import type { FeatureFlagKey } from "@caseai-connect/api-contracts"
import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { TransactionService } from "@/common/transaction/transaction.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { PermissionService } from "@/domains/rbac/permission.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentTagsService } from "../documents/tags/document-tags.service"
import { FeatureFlag } from "../feature-flags/feature-flag.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectMembershipsService } from "./memberships/project-memberships.service"
import { Project } from "./project.entity"
import { ProjectModel } from "./project.model"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectRepository } from "./project.repository"

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projectEntityRepository: Repository<Project>,
    @InjectRepository(FeatureFlag) private readonly featureFlagRepository: Repository<FeatureFlag>,
    private readonly projectRepository: ProjectRepository,
    private readonly projectMembershipsService: ProjectMembershipsService,
    private readonly documentTagsService: DocumentTagsService,
    private readonly transactionService: TransactionService,
    private readonly permissionService: PermissionService,
  ) {}

  async createProject(params: {
    organizationId: string
    userId: string
    name: string
  }): Promise<ProjectModel> {
    const project = this.projectEntityRepository.create(params)
    await this.projectEntityRepository.save(project)
    const membership = await this.projectMembershipsService.createProjectOwnerMembership({
      projectId: project.id,
      userId: params.userId,
    })
    await this.documentTagsService.createPublicDocumentsTag({
      organizationId: params.organizationId,
      projectId: project.id,
    })

    // the membership carries the RBAC role it was created with: ask RBAC what that role grants
    const permissions = membership.roleId
      ? await this.permissionService.listPermissionsForRole(membership.roleId)
      : []
    return ProjectModel.fromEntity(project, permissions)
  }

  async listUserProjects(userId: string): Promise<ProjectModel[]> {
    // all the project ids the user has access to, along with their permissions
    const permissionsByProjectId = await this.permissionService.listResourcePermissions(
      userId,
      "project",
    )

    return this.projectRepository.findAllByIds(permissionsByProjectId)
  }

  /**
   * Org-scoped listing: RBAC decides WHICH projects the user sees, but the
   * response (ProjectDto) carries no permissions, so entities are returned.
   */
  async listProjects({
    organizationId,
    userId,
  }: {
    organizationId: string
    userId: string
  }): Promise<ProjectModel[]> {
    const permissionsByProjectId = await this.permissionService.listResourcePermissions(
      userId,
      "project",
    )

    return this.projectRepository.findAllByOrganizationIdAndIds(
      organizationId,
      permissionsByProjectId,
    )
  }

  async getProject(organizationId: string, projectId: string): Promise<Project | undefined> {
    const project = await this.projectEntityRepository.findOne({
      where: { id: projectId, organizationId },
      relations: { featureFlags: true, projectAgentSessionCategories: true },
    })
    return project ?? undefined
  }

  async updateProject({
    project,
    name,
    userId,
  }: {
    project: Project
    name: string
    userId: string
  }): Promise<ProjectModel> {
    project.name = name
    const saved = await this.projectEntityRepository.save(project)

    const permissionsByProjectId = await this.permissionService.listResourcePermissions(
      userId,
      "project",
    )
    return ProjectModel.fromEntity(saved, permissionsByProjectId.get(saved.id) ?? [])
  }

  async deleteProject(project: Project): Promise<void> {
    await this.transactionService.run(async () => {
      await this.projectRepository.softDelete(project.id)
      await this.projectMembershipsService.deleteMembership({ projectId: project.id })
    })
  }

  async hasFeature({
    connectScope,
    feature,
  }: {
    connectScope: RequiredConnectScope
    feature: FeatureFlagKey
  }): Promise<boolean> {
    const flag = await this.featureFlagRepository.findOne({
      where: {
        projectId: connectScope.projectId,
        featureFlagKey: feature,
        enabled: true,
      },
    })
    return flag !== null
  }
}
