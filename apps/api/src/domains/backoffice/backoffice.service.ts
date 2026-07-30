import type { FeatureFlagKey } from "@caseai-connect/api-contracts"
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, type Repository } from "typeorm"
import type { AgentMembershipModel } from "@/domains/agents/memberships/agent-membership.model"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentMembershipsService } from "@/domains/agents/memberships/agent-memberships.service"
import type { OrganizationMembershipModel } from "@/domains/organizations/memberships/organization-membership.model"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { OrganizationMembershipsService } from "@/domains/organizations/memberships/organization-memberships.service"
import type { ProjectMembershipModel } from "@/domains/projects/memberships/project-membership.model"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectMembershipsService } from "@/domains/projects/memberships/project-memberships.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { PermissionService, type ResourceIdsScope } from "@/domains/rbac/permission.service"
import { BACKOFFICE_ORGANIZATION_READ_PERMISSION } from "@/domains/rbac/rbac.constants"
import { Agent } from "../agents/agent.entity"
import { FeatureFlag } from "../feature-flags/feature-flag.entity"
import { Organization } from "../organizations/organization.entity"
import { Project } from "../projects/project.entity"
import type { ReviewCampaignMembershipModel } from "../review-campaigns/memberships/review-campaign-membership.model"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ReviewCampaignMembershipsService } from "../review-campaigns/memberships/review-campaign-memberships.service"
import { User } from "../users/user.entity"

function sortMembershipsByUserEmail<TMembership extends { user: { email: string } }>(
  memberships: TMembership[],
): TMembership[] {
  return [...memberships].sort((left, right) =>
    left.user.email.localeCompare(right.user.email, undefined, { sensitivity: "base" }),
  )
}

function sortOrganizationMembershipsByOrganizationName(
  memberships: OrganizationMembershipModel[],
): OrganizationMembershipModel[] {
  return [...memberships].sort((left, right) =>
    left.organization.name.localeCompare(right.organization.name, undefined, {
      sensitivity: "base",
    }),
  )
}

function sortProjectMembershipsByProjectName(
  memberships: ProjectMembershipModel[],
): ProjectMembershipModel[] {
  return [...memberships].sort((left, right) =>
    left.project.name.localeCompare(right.project.name, undefined, { sensitivity: "base" }),
  )
}

function sortAgentMembershipsByAgentName(
  memberships: AgentMembershipModel[],
): AgentMembershipModel[] {
  return [...memberships].sort((left, right) =>
    left.agent.name.localeCompare(right.agent.name, undefined, { sensitivity: "base" }),
  )
}

function sortReviewCampaignMembershipsByCampaignName(
  memberships: ReviewCampaignMembershipModel[],
): ReviewCampaignMembershipModel[] {
  return [...memberships].sort((left, right) => {
    const campaignNameCompare = left.campaign.name.localeCompare(right.campaign.name, undefined, {
      sensitivity: "base",
    })
    if (campaignNameCompare !== 0) return campaignNameCompare
    return left.role.localeCompare(right.role)
  })
}

@Injectable()
export class BackofficeService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Project) private readonly projectRepository: Repository<Project>,
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Agent) private readonly agentRepository: Repository<Agent>,
    private readonly organizationMembershipsService: OrganizationMembershipsService,
    private readonly projectMembershipsService: ProjectMembershipsService,
    private readonly agentMembershipsService: AgentMembershipsService,
    private readonly reviewCampaignMembershipsService: ReviewCampaignMembershipsService,
    private readonly permissionService: PermissionService,
  ) {}

  async createOrganization({
    actingUserId,
    name,
  }: {
    actingUserId: string
    name: string
  }): Promise<Organization> {
    const trimmedName = name?.trim() ?? ""
    if (trimmedName.length < 3) {
      throw new BadRequestException("Organization name must be at least 3 characters long")
    }

    const organization = this.organizationRepository.create({ name: trimmedName })
    const savedOrganization = await this.organizationRepository.save(organization)

    await this.organizationMembershipsService.createOrganizationOwnerMembership({
      userId: actingUserId,
      organizationId: savedOrganization.id,
    })

    return savedOrganization
  }

  async listOrganizations({
    userId,
    page,
    limit,
    search,
  }: {
    userId: string
    page: number
    limit: number
    search?: string
  }): Promise<{ organizations: Organization[]; total: number }> {
    const qb = this.organizationRepository
      .createQueryBuilder("organization")
      .orderBy("LOWER(organization.name)", "ASC")

    const organizationIds = await this.permissionService.listResourceIds(
      userId,
      BACKOFFICE_ORGANIZATION_READ_PERMISSION,
    )
    if (organizationIds.length === 0) {
      return { organizations: [], total: 0 }
    }
    qb.andWhere("organization.id IN (:...organizationIds)", {
      organizationIds,
    })

    const trimmedSearch = search?.trim()
    if (trimmedSearch) {
      const searchPattern = `%${trimmedSearch.toLowerCase()}%`
      qb.andWhere(
        "(LOWER(organization.name) LIKE :searchPattern OR CAST(organization.id AS TEXT) LIKE :searchPattern)",
        { searchPattern },
      )
    }

    const [organizations, total] = await qb
      .skip(page * limit)
      .take(limit)
      .getManyAndCount()
    return { organizations, total }
  }

  async getOrganizationDetail({
    requestingUserId,
    targetOrganizationId,
  }: {
    requestingUserId: string
    targetOrganizationId: string
  }): Promise<{
    organization: Organization
    members: OrganizationMembershipModel[]
    projects: Project[]
  } | null> {
    const canRead = await this.permissionService.has(
      requestingUserId,
      BACKOFFICE_ORGANIZATION_READ_PERMISSION,
      { type: "organization", id: targetOrganizationId },
    )
    if (!canRead) return null

    const organization = await this.organizationRepository.findOne({
      where: { id: targetOrganizationId },
    })
    if (!organization) return null

    const [members, rawProjects] = await Promise.all([
      this.organizationMembershipsService.listOrganizationMemberships(targetOrganizationId),
      this.projectRepository
        .createQueryBuilder("project")
        .select(["project.id", "project.name"])
        .where("project.organizationId = :organizationId", { organizationId: targetOrganizationId })
        .orderBy("project.name", "ASC")
        .getMany(),
    ])

    const projects = await this.attachFeatureFlagsToProjects(rawProjects)

    return { organization, members, projects }
  }

  async listAgents({
    canListAll,
    userId,
    page,
    limit,
    search,
  }: {
    canListAll: boolean
    userId: string
    page: number
    limit: number
    search?: string
  }): Promise<{ agents: Agent[]; total: number }> {
    const qb = this.agentRepository
      .createQueryBuilder("agent")
      .leftJoin("agent.project", "project")
      .addSelect(["project.id", "project.name"])
      .orderBy("agent.name", "ASC")

    if (!canListAll) {
      const { organizationIds, projectIds } = await this.findAdminOrganizationAndProjectIds(userId)
      if (organizationIds.size === 0 && projectIds.size === 0) {
        return { agents: [], total: 0 }
      }
      if (organizationIds.size > 0 && projectIds.size > 0) {
        qb.andWhere(
          `(agent.projectId IN (:...projectIds) OR project.organizationId IN (:...organizationIds))`,
          {
            projectIds: Array.from(projectIds),
            organizationIds: Array.from(organizationIds),
          },
        )
      } else if (organizationIds.size > 0) {
        qb.andWhere("project.organizationId IN (:...organizationIds)", {
          organizationIds: Array.from(organizationIds),
        })
      } else {
        qb.andWhere("agent.projectId IN (:...projectIds)", {
          projectIds: Array.from(projectIds),
        })
      }
    }

    const trimmedSearch = search?.trim()
    if (trimmedSearch) {
      const searchPattern = `%${trimmedSearch.toLowerCase()}%`
      qb.andWhere(
        "(LOWER(agent.name) LIKE :searchPattern OR LOWER(project.name) LIKE :searchPattern OR CAST(agent.id AS TEXT) LIKE :searchPattern)",
        { searchPattern },
      )
    }

    const [agents, total] = await qb
      .skip(page * limit)
      .take(limit)
      .getManyAndCount()
    return { agents, total }
  }

  async getAgentDetail({
    canListAll,
    requestingUserId,
    targetAgentId,
  }: {
    canListAll: boolean
    requestingUserId: string
    targetAgentId: string
  }): Promise<{ agent: Agent; members: AgentMembershipModel[] } | null> {
    const agent = await this.agentRepository
      .createQueryBuilder("agent")
      .select(["agent.id", "agent.name", "agent.createdAt"])
      .leftJoin("agent.project", "project")
      .addSelect(["project.id", "project.name", "project.organizationId"])
      .leftJoin("project.organization", "organization")
      .addSelect(["organization.id", "organization.name"])
      .where("agent.id = :agentId", { agentId: targetAgentId })
      .getOne()

    if (!agent) return null

    if (!canListAll) {
      const { organizationIds, projectIds } =
        await this.findAdminOrganizationAndProjectIds(requestingUserId)
      const projectId = agent.project?.id
      const organizationId = agent.project?.organization?.id
      const hasAccess =
        (projectId !== undefined && projectIds.has(projectId)) ||
        (organizationId !== undefined && organizationIds.has(organizationId))
      if (!hasAccess) return null
    }

    const members = sortMembershipsByUserEmail(
      await this.agentMembershipsService.listAgentMemberships(targetAgentId),
    )

    return { agent, members }
  }

  private async findAdminOrganizationAndProjectIds(
    userId: string,
  ): Promise<{ organizationIds: Set<string>; projectIds: Set<string> }> {
    const [adminOrganizationMemberships, adminProjectMemberships] = await Promise.all([
      this.organizationMembershipsService.listAdminAndOwnerMembershipsForUser(userId),
      this.projectMembershipsService.listAdminAndOwnerMembershipsForUser(userId),
    ])
    return {
      organizationIds: new Set(
        adminOrganizationMemberships.map((membership) => membership.organizationId),
      ),
      projectIds: new Set(adminProjectMemberships.map((membership) => membership.projectId)),
    }
  }

  async listUsers({
    userId,
    page,
    limit,
    search,
  }: {
    userId: string
    page: number
    limit: number
    search?: string
  }): Promise<{ users: User[]; total: number }> {
    const qb = this.userRepository.createQueryBuilder("user").orderBy("LOWER(user.email)", "ASC")

    const visibleUsers = await this.findVisibleUserIds(userId)
    if (visibleUsers.scope === "ids") {
      if (visibleUsers.ids.length === 0) {
        return { users: [], total: 0 }
      }
      qb.andWhere("user.id IN (:...visibleUserIds)", {
        visibleUserIds: visibleUsers.ids,
      })
    }

    const trimmedSearch = search?.trim()
    if (trimmedSearch) {
      const searchPattern = `%${trimmedSearch.toLowerCase()}%`
      qb.andWhere(
        `(
          LOWER("user"."email") LIKE :searchPattern
          OR LOWER(COALESCE("user"."name", '')) LIKE :searchPattern
          OR CAST("user"."id" AS TEXT) LIKE :searchPattern
        )`,
        { searchPattern },
      )
    }

    const [users, total] = await qb
      .skip(page * limit)
      .take(limit)
      .getManyAndCount()

    return { users, total }
  }

  async listProjects({
    canListAll,
    userId,
    page,
    limit,
    search,
  }: {
    canListAll: boolean
    userId: string
    page: number
    limit: number
    search?: string
  }): Promise<{ projects: Project[]; total: number }> {
    const qb = this.projectRepository
      .createQueryBuilder("project")
      .leftJoin("project.organization", "org")
      .addSelect(["org.id", "org.name"])
      .orderBy("project.name", "ASC")

    if (!canListAll) {
      const { organizationIds, projectIds } = await this.findAdminOrganizationAndProjectIds(userId)
      if (organizationIds.size === 0 && projectIds.size === 0) {
        return { projects: [], total: 0 }
      }
      if (organizationIds.size > 0 && projectIds.size > 0) {
        qb.andWhere(
          "(project.organizationId IN (:...organizationIds) OR project.id IN (:...projectIds))",
          {
            organizationIds: Array.from(organizationIds),
            projectIds: Array.from(projectIds),
          },
        )
      } else if (organizationIds.size > 0) {
        qb.andWhere("project.organizationId IN (:...organizationIds)", {
          organizationIds: Array.from(organizationIds),
        })
      } else {
        qb.andWhere("project.id IN (:...projectIds)", {
          projectIds: Array.from(projectIds),
        })
      }
    }

    const trimmedSearch = search?.trim()
    if (trimmedSearch) {
      const searchPattern = `%${trimmedSearch.toLowerCase()}%`
      qb.andWhere(
        `(
          LOWER(project.name) LIKE :searchPattern
          OR LOWER(org.name) LIKE :searchPattern
          OR CAST(project.id AS TEXT) LIKE :searchPattern
        )`,
        { searchPattern },
      )
    }

    const [rawProjects, total] = await qb
      .skip(page * limit)
      .take(limit)
      .getManyAndCount()

    const projects = await this.attachFeatureFlagsToProjects(rawProjects)

    return { projects, total }
  }

  private async attachFeatureFlagsToProjects(projects: Project[]): Promise<Project[]> {
    if (projects.length === 0) return projects
    const projectIds = projects.map((project) => project.id)
    const featureFlags = await this.featureFlagRepository.find({
      where: { projectId: In(projectIds) },
      select: ["projectId", "featureFlagKey", "enabled"],
    })
    const featureFlagsByProjectId = new Map<string, typeof featureFlags>()
    for (const featureFlag of featureFlags) {
      const existing = featureFlagsByProjectId.get(featureFlag.projectId) ?? []
      existing.push(featureFlag)
      featureFlagsByProjectId.set(featureFlag.projectId, existing)
    }
    return projects.map((project) => ({
      ...project,
      featureFlags: featureFlagsByProjectId.get(project.id) ?? [],
    }))
  }

  async getProjectDetail({
    canListAll,
    requestingUserId,
    targetProjectId,
  }: {
    canListAll: boolean
    requestingUserId: string
    targetProjectId: string
  }): Promise<{
    project: Project
    members: ProjectMembershipModel[]
    agents: Agent[]
  } | null> {
    if (!canListAll) {
      const { organizationIds, projectIds } =
        await this.findAdminOrganizationAndProjectIds(requestingUserId)
      const targetProject = await this.projectRepository.findOne({
        where: { id: targetProjectId },
        select: ["id", "organizationId"],
      })
      if (!targetProject) return null
      const canAccess =
        organizationIds.has(targetProject.organizationId) || projectIds.has(targetProjectId)
      if (!canAccess) return null
    }

    const project = await this.projectRepository
      .createQueryBuilder("project")
      .leftJoin("project.organization", "org")
      .addSelect(["org.id", "org.name"])
      .leftJoinAndSelect("project.featureFlags", "featureFlag")
      .where("project.id = :id", { id: targetProjectId })
      .getOne()
    if (!project) return null

    const [members, agents] = await Promise.all([
      sortMembershipsByUserEmail(
        await this.projectMembershipsService.listProjectMemberships(targetProjectId),
      ),
      this.agentRepository
        .createQueryBuilder("agent")
        .select(["agent.id", "agent.name"])
        .where("agent.projectId = :projectId", { projectId: targetProjectId })
        .orderBy("LOWER(agent.name)", "ASC")
        .getMany(),
    ])

    return { project, members, agents }
  }

  async getUserDetail({
    requestingUserId,
    targetUserId,
  }: {
    requestingUserId: string
    targetUserId: string
  }): Promise<{
    user: User
    organizationMemberships: OrganizationMembershipModel[]
    projectMemberships: ProjectMembershipModel[]
    agentMemberships: AgentMembershipModel[]
    reviewCampaignMemberships: ReviewCampaignMembershipModel[]
  } | null> {
    const visibleUsers = await this.findVisibleUserIds(requestingUserId)
    if (visibleUsers.scope === "ids" && !visibleUsers.ids.includes(targetUserId)) {
      return null
    }

    const user = await this.userRepository.findOne({ where: { id: targetUserId } })
    if (!user) return null

    const [
      organizationMemberships,
      projectMemberships,
      agentMemberships,
      reviewCampaignMemberships,
    ] = await Promise.all([
      this.organizationMembershipsService
        .listMembershipsForUser(targetUserId)
        .then(sortOrganizationMembershipsByOrganizationName),
      this.projectMembershipsService
        .listMembershipsForUser(targetUserId)
        .then(sortProjectMembershipsByProjectName),
      this.agentMembershipsService
        .listMembershipsForUser(targetUserId)
        .then(sortAgentMembershipsByAgentName),
      this.reviewCampaignMembershipsService
        .listMembershipsForUser(targetUserId)
        .then(sortReviewCampaignMembershipsByCampaignName),
    ])

    return {
      user,
      organizationMemberships,
      projectMemberships,
      agentMemberships,
      reviewCampaignMemberships,
    }
  }

  /**
   * Users visible to the requesting user:
   * - `backoffice.user.read` held globally: the whole directory
   * - otherwise: self + members of resources granting `user.read`
   *   (PermissionService), plus members of agents the user administers
   *   (legacy union: agent roles are not in the RBAC catalog yet)
   */
  private async findVisibleUserIds(userId: string): Promise<ResourceIdsScope> {
    const userScope = await this.permissionService.listUserIds(userId)
    if (userScope.scope === "all") {
      return userScope
    }

    const adminAgentMemberships =
      await this.agentMembershipsService.listAdminAndOwnerMembershipsForUser(userId)
    const sharedAgentMemberships = await this.agentMembershipsService.listMembershipsByAgentIds(
      adminAgentMemberships.map((membership) => membership.agentId),
    )

    const visibleUserIds = new Set<string>(userScope.ids)
    for (const membership of sharedAgentMemberships) {
      visibleUserIds.add(membership.userId)
    }
    return { scope: "ids", ids: [...visibleUserIds] }
  }

  async addFeatureFlag({
    projectId,
    featureFlagKey,
    canListAll,
    userId,
  }: {
    projectId: string
    featureFlagKey: FeatureFlagKey
    canListAll: boolean
    userId: string
  }): Promise<void> {
    await this.assertProjectEditable({ canListAll, userId, projectId })

    const existing = await this.featureFlagRepository.findOne({
      where: { projectId, featureFlagKey },
    })
    if (existing) {
      if (!existing.enabled) {
        existing.enabled = true
        await this.featureFlagRepository.save(existing)
      }
      return
    }
    const flag = this.featureFlagRepository.create({
      projectId,
      featureFlagKey,
      enabled: true,
    })
    await this.featureFlagRepository.save(flag)
  }

  async removeFeatureFlag({
    projectId,
    featureFlagKey,
    canListAll,
    userId,
  }: {
    projectId: string
    featureFlagKey: FeatureFlagKey
    canListAll: boolean
    userId: string
  }): Promise<void> {
    await this.assertProjectEditable({ canListAll, userId, projectId })
    await this.featureFlagRepository.delete({ projectId, featureFlagKey })
  }

  private async assertProjectEditable({
    canListAll,
    userId,
    projectId,
  }: {
    canListAll: boolean
    userId: string
    projectId: string
  }): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } })
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`)
    }
    if (canListAll) {
      return
    }

    const projectMembership = await this.projectMembershipsService.findProjectMembership({
      userId,
      projectId,
    })

    if (
      !projectMembership ||
      (projectMembership.role !== "admin" && projectMembership.role !== "owner")
    ) {
      throw new ForbiddenException(`User does not have admin access to project ${projectId}`)
    }
  }
}
