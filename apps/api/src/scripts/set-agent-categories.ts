import { Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AppModule } from "@/app.module"
import { Agent } from "@/domains/agents/agent.entity"
import { AgentCategoriesService } from "@/domains/agents/categories/agent-categories.service"
import {
  AGENT_DEFAULT_CATEGORIES_ENV,
  parseUniqueCommaSeparatedCategoryNames,
  resolveConfiguredDefaultAgentCategoryNames,
} from "@/domains/agents/categories/agent-default-category-names"
import { Organization } from "@/domains/organizations/organization.entity"
import { Project } from "@/domains/projects/project.entity"
import { ask, confirmDatabaseTarget } from "@/scripts/script-bootstrap"

const logger = new Logger("SetAgentCategories")

type CliOptions = {
  categoryNames?: string[]
}

function parseCliOptions(argv: string[]): CliOptions {
  const categoriesIndex = argv.indexOf("--categories")
  if (categoriesIndex < 0 || !argv[categoriesIndex + 1]) {
    return {}
  }

  return {
    categoryNames: parseUniqueCommaSeparatedCategoryNames(argv[categoriesIndex + 1]!),
  }
}

function mergeCategoryNameLists(primary: string[], secondary: string[]): string[] {
  const merged: string[] = []
  const seen = new Set<string>()

  for (const categoryName of primary) {
    if (!seen.has(categoryName)) {
      seen.add(categoryName)
      merged.push(categoryName)
    }
  }

  for (const categoryName of secondary) {
    if (!seen.has(categoryName)) {
      seen.add(categoryName)
      merged.push(categoryName)
    }
  }

  return merged
}

async function selectFromList<T>(params: {
  title: string
  items: T[]
  toLine: (item: T, index: number) => string
}): Promise<T> {
  if (params.items.length === 0) {
    throw new Error(`Cannot select from empty list for "${params.title}"`)
  }

  logger.log(`\n${params.title}`)
  for (const [itemIndex, item] of params.items.entries()) {
    logger.log(`  [${itemIndex + 1}] ${params.toLine(item, itemIndex)}`)
  }

  while (true) {
    const answer = await ask(`Choose ${params.title.toLowerCase()} number (or 'q' to quit): `)
    if (answer.toLowerCase() === "q") {
      logger.log("Aborted.")
      process.exit(0)
    }

    const chosenIndex = Number.parseInt(answer, 10)
    if (!Number.isNaN(chosenIndex) && chosenIndex >= 1 && chosenIndex <= params.items.length) {
      return params.items[chosenIndex - 1]!
    }

    logger.warn("Invalid selection. Please enter one of the listed numbers.")
  }
}

async function askIncludeDefaultCategories(configuredDefaults: string[]): Promise<boolean> {
  if (configuredDefaults.length === 0) {
    logger.log(
      `\nNo default categories are available (${AGENT_DEFAULT_CATEGORIES_ENV} is set but empty, or only commas were provided). Unset it to use built-in defaults.`,
    )
    return false
  }

  logger.log(`\nDefault categories available: ${configuredDefaults.join(", ")}`)
  while (true) {
    const answer = await ask("Include these default categories in this update? (yes/no): ")
    const normalized = answer.toLowerCase()
    if (normalized === "yes") {
      return true
    }
    if (normalized === "no") {
      return false
    }
    logger.warn("Please answer yes or no.")
  }
}

async function resolveAdditionalCategoryNames(options: CliOptions): Promise<string[]> {
  if (options.categoryNames && options.categoryNames.length > 0) {
    return options.categoryNames
  }

  const categoryNamesRaw = await ask(
    "Additional categories as comma-separated values (optional, Enter to skip): ",
  )
  if (!categoryNamesRaw) {
    return []
  }
  return parseUniqueCommaSeparatedCategoryNames(categoryNamesRaw)
}

async function resolveFinalCategoryNames(params: {
  options: CliOptions
  includeDefaults: boolean
  configuredDefaults: string[]
}): Promise<string[]> {
  const primary = params.includeDefaults ? params.configuredDefaults : []
  const secondary = await resolveAdditionalCategoryNames(params.options)
  return mergeCategoryNameLists(primary, secondary)
}

async function bootstrapCli(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2))
  await confirmDatabaseTarget(logger)

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  })

  try {
    const agentCategoriesService = app.get(AgentCategoriesService)
    const organizationRepository = app.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    )
    const projectRepository = app.get<Repository<Project>>(getRepositoryToken(Project))
    const agentRepository = app.get<Repository<Agent>>(getRepositoryToken(Agent))

    const organizations = await organizationRepository.find({ order: { name: "ASC" } })
    if (organizations.length === 0) {
      logger.log("No organizations found.")
      return
    }

    const selectedOrganization = await selectFromList({
      title: "Organizations",
      items: organizations,
      toLine: (organization) => `${organization.name} (${organization.id})`,
    })

    const projects = await projectRepository.find({
      where: { organizationId: selectedOrganization.id },
      order: { name: "ASC" },
    })
    if (projects.length === 0) {
      logger.log(`No workspaces found for organization "${selectedOrganization.name}".`)
      return
    }

    const selectedProject = await selectFromList({
      title: `Workspaces in ${selectedOrganization.name}`,
      items: projects,
      toLine: (project) => `${project.name} (${project.id})`,
    })

    const agents = await agentRepository.find({
      where: {
        organizationId: selectedOrganization.id,
        projectId: selectedProject.id,
      },
      order: { name: "ASC" },
    })
    if (agents.length === 0) {
      logger.log(`No agents found in workspace "${selectedProject.name}".`)
      return
    }

    const selectedAgent = await selectFromList({
      title: `Agents in ${selectedProject.name}`,
      items: agents,
      toLine: (agent) => `${agent.name} (${agent.type}) - ${agent.id}`,
    })

    const activeCategoryNamesBeforeUpdate =
      await agentCategoriesService.listActiveCategoryNamesForAgent(selectedAgent.id)
    logger.log(
      `\nCurrent active categories: ${activeCategoryNamesBeforeUpdate.length > 0 ? activeCategoryNamesBeforeUpdate.join(", ") : "(none)"}`,
    )

    const configuredDefaults = resolveConfiguredDefaultAgentCategoryNames()
    const includeDefaults = await askIncludeDefaultCategories(configuredDefaults)

    let categoryNames = await resolveFinalCategoryNames({
      options,
      includeDefaults,
      configuredDefaults,
    })

    while (categoryNames.length === 0) {
      logger.warn(
        "At least one category is required (enable defaults, use --categories, or type additional names).",
      )
      const retryRaw = await ask("Enter categories as comma-separated values (required): ")
      categoryNames = parseUniqueCommaSeparatedCategoryNames(retryRaw)
    }

    logger.log(`Requested categories: ${categoryNames.join(", ")}`)

    const confirmation = await ask(
      "This will replace current active categories for this agent. Continue? (yes/no): ",
    )
    if (confirmation.toLowerCase() !== "yes") {
      logger.log("Aborted.")
      return
    }

    const result = await agentCategoriesService.replaceActiveCategoriesForAgent(
      selectedAgent.id,
      categoryNames,
    )

    const activeCategoriesAfterUpdate =
      await agentCategoriesService.listActiveCategoryNamesForAgent(selectedAgent.id)

    logger.log(
      `\nUpdated categories for agent "${selectedAgent.name}" (${selectedAgent.id}): ${activeCategoriesAfterUpdate.join(", ")}`,
    )
    logger.log(
      `Summary: created=${result.createdCount}, restored=${result.restoredCount}, deactivated=${result.deletedCount}`,
    )
  } finally {
    await app.close()
  }
}

if (require.main === module) {
  void bootstrapCli()
}
