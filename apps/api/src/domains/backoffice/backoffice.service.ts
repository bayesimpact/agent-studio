import type { FeatureFlagKey } from "@caseai-connect/api-contracts"
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DataSource, type Repository } from "typeorm"
import { FeatureFlag } from "../feature-flags/feature-flag.entity"
import { Organization } from "../organizations/organization.entity"
import { Project } from "../projects/project.entity"
import { User } from "../users/user.entity"
import type {
  BackofficeOrganizationView,
  BackofficeProjectAgentCategoryView,
  BackofficeProjectView,
} from "./backoffice.helpers"

type ProjectAgentCategoryRow = {
  id: string
  projectId: string
  name: string
  deletedAt: Date | null
  usageCount: number
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
    private readonly dataSource: DataSource,
  ) {}

  async listOrganizationsWithProjects(): Promise<BackofficeOrganizationView[]> {
    const organizations = await this.organizationRepository.find({
      relations: {
        projects: { featureFlags: true },
      },
      order: { createdAt: "DESC" },
    })

    const projects = organizations.flatMap((organization) => organization.projects ?? [])
    const categoriesByProjectId = await this.listProjectAgentCategoriesByProjectIds(
      projects.map((project) => project.id),
    )

    return organizations.map((organization) => ({
      ...organization,
      projects: (organization.projects ?? []).map(
        (project): BackofficeProjectView => ({
          ...project,
          projectAgentCategories: categoriesByProjectId.get(project.id) ?? [],
        }),
      ),
    }))
  }

  async listUsersWithMemberships(): Promise<User[]> {
    return this.userRepository.find({
      relations: {
        memberships: { organization: true },
        projectMemberships: { project: true },
        agentMemberships: { agent: true },
      },
      order: { createdAt: "DESC" },
    })
  }

  async addFeatureFlag({
    projectId,
    featureFlagKey,
  }: {
    projectId: string
    featureFlagKey: FeatureFlagKey
  }): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } })
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`)
    }
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
  }: {
    projectId: string
    featureFlagKey: FeatureFlagKey
  }): Promise<void> {
    await this.featureFlagRepository.delete({ projectId, featureFlagKey })
  }

  async replaceProjectAgentCategories({
    projectId,
    categoryNames,
  }: {
    projectId: string
    categoryNames: string[]
  }): Promise<BackofficeProjectAgentCategoryView[]> {
    await this.assertProjectExists(projectId)

    const normalizedCategoryNames = normalizeCategoryNames(categoryNames)
    const existingProjectAgentCategories =
      await this.listProjectAgentCategoryRowsIncludingDeleted(projectId)

    const desiredCategoryNames = new Set(normalizedCategoryNames)
    const existingCategoryByName = new Map(
      existingProjectAgentCategories.map((existingCategory) => [
        existingCategory.name,
        existingCategory,
      ]),
    )

    for (const existingCategory of existingProjectAgentCategories) {
      const shouldRemove = !desiredCategoryNames.has(existingCategory.name)
      const isActive = existingCategory.deletedAt === null
      const isUsedInConversation = existingCategory.usageCount > 0

      if (shouldRemove && isActive && isUsedInConversation) {
        throw new BadRequestException(
          `Category "${existingCategory.name}" cannot be removed because it is already assigned to a conversation.`,
        )
      }
    }

    for (const categoryName of normalizedCategoryNames) {
      const existingCategory = existingCategoryByName.get(categoryName)
      if (!existingCategory) {
        await this.dataSource.query(
          `INSERT INTO "project_agent_category" ("project_id", "name") VALUES ($1, $2)`,
          [projectId, categoryName],
        )
        continue
      }

      if (existingCategory.deletedAt !== null) {
        await this.dataSource.query(
          `UPDATE "project_agent_category" SET "deleted_at" = NULL, "updated_at" = now() WHERE "id" = $1`,
          [existingCategory.id],
        )
      }
    }

    for (const existingCategory of existingProjectAgentCategories) {
      const shouldStayActive = desiredCategoryNames.has(existingCategory.name)
      const isActive = existingCategory.deletedAt === null
      if (!shouldStayActive && isActive) {
        await this.dataSource.query(
          `UPDATE "project_agent_category" SET "deleted_at" = now(), "updated_at" = now() WHERE "id" = $1`,
          [existingCategory.id],
        )
      }
    }

    return this.listProjectAgentCategories(projectId)
  }

  private async listProjectAgentCategories(
    projectId: string,
  ): Promise<BackofficeProjectAgentCategoryView[]> {
    const categoriesByProjectId = await this.listProjectAgentCategoriesByProjectIds([projectId])
    return categoriesByProjectId.get(projectId) ?? []
  }

  private async listProjectAgentCategoriesByProjectIds(
    projectIds: string[],
  ): Promise<Map<string, BackofficeProjectAgentCategoryView[]>> {
    const categoriesByProjectId = new Map<string, BackofficeProjectAgentCategoryView[]>()
    if (projectIds.length === 0) {
      return categoriesByProjectId
    }

    const rows = await this.dataSource.query<ProjectAgentCategoryRow[]>(
      `
        SELECT
          "project_agent_category"."id" AS "id",
          "project_agent_category"."project_id" AS "projectId",
          "project_agent_category"."name" AS "name",
          "project_agent_category"."deleted_at" AS "deletedAt",
          COUNT(DISTINCT "conversation_agent_session_category"."id")::int AS "usageCount"
        FROM "project_agent_category"
        LEFT JOIN "agent_category"
          ON "agent_category"."project_agent_category_id" = "project_agent_category"."id"
        LEFT JOIN "conversation_agent_session_category"
          ON "conversation_agent_session_category"."project_agent_category_id" = "project_agent_category"."id"
          OR "conversation_agent_session_category"."agent_category_id" = "agent_category"."id"
        WHERE "project_agent_category"."project_id" = ANY($1::uuid[])
          AND "project_agent_category"."deleted_at" IS NULL
        GROUP BY
          "project_agent_category"."id",
          "project_agent_category"."project_id",
          "project_agent_category"."name",
          "project_agent_category"."deleted_at"
        ORDER BY "project_agent_category"."name" ASC
      `,
      [projectIds],
    )

    for (const row of rows) {
      const projectCategories = categoriesByProjectId.get(row.projectId) ?? []
      projectCategories.push({
        id: row.id,
        name: row.name,
        isUsedInConversation: row.usageCount > 0,
      })
      categoriesByProjectId.set(row.projectId, projectCategories)
    }

    return categoriesByProjectId
  }

  private async listProjectAgentCategoryRowsIncludingDeleted(
    projectId: string,
  ): Promise<ProjectAgentCategoryRow[]> {
    return this.dataSource.query<ProjectAgentCategoryRow[]>(
      `
        SELECT
          "project_agent_category"."id" AS "id",
          "project_agent_category"."project_id" AS "projectId",
          "project_agent_category"."name" AS "name",
          "project_agent_category"."deleted_at" AS "deletedAt",
          COUNT(DISTINCT "conversation_agent_session_category"."id")::int AS "usageCount"
        FROM "project_agent_category"
        LEFT JOIN "agent_category"
          ON "agent_category"."project_agent_category_id" = "project_agent_category"."id"
        LEFT JOIN "conversation_agent_session_category"
          ON "conversation_agent_session_category"."project_agent_category_id" = "project_agent_category"."id"
          OR "conversation_agent_session_category"."agent_category_id" = "agent_category"."id"
        WHERE "project_agent_category"."project_id" = $1
        GROUP BY
          "project_agent_category"."id",
          "project_agent_category"."project_id",
          "project_agent_category"."name",
          "project_agent_category"."deleted_at"
        ORDER BY "project_agent_category"."name" ASC
      `,
      [projectId],
    )
  }

  private async assertProjectExists(projectId: string): Promise<void> {
    const projectExists = await this.projectRepository.exists({ where: { id: projectId } })
    if (!projectExists) {
      throw new NotFoundException(`Project ${projectId} not found`)
    }
  }
}

function normalizeCategoryNames(categoryNames: string[]): string[] {
  const normalizedCategoryNames: string[] = []
  const seenCategoryNames = new Set<string>()

  for (const categoryName of categoryNames) {
    const normalizedCategoryName = categoryName.trim()
    if (normalizedCategoryName.length === 0) {
      continue
    }
    if (!seenCategoryNames.has(normalizedCategoryName)) {
      normalizedCategoryNames.push(normalizedCategoryName)
      seenCategoryNames.add(normalizedCategoryName)
    }
  }

  return normalizedCategoryNames
}
