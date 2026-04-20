import { afterAll } from "@jest/globals"
import {
  type AllRepositories,
  clearTestDatabase,
  setupE2eTestDatabase,
  teardownE2eTestDatabase,
} from "@/common/test/test-database"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { AgentsModule } from "../agents.module"
import { AgentCategoriesService } from "./agent-categories.service"

describe("AgentCategoriesService", () => {
  let service: AgentCategoriesService
  let setup: Awaited<ReturnType<typeof setupE2eTestDatabase>>
  let repositories: AllRepositories

  beforeAll(async () => {
    setup = await setupE2eTestDatabase({
      additionalImports: [AgentsModule],
    })
  })

  afterAll(async () => {
    await teardownE2eTestDatabase(setup)
    await sdk.shutdown()
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    service = setup.module.get<AgentCategoriesService>(AgentCategoriesService)
    repositories = setup.getAllRepositories()
  })

  describe("replaceActiveCategoriesForAgent", () => {
    it("should create categories and list them", async () => {
      const { agent } = await createOrganizationWithAgent(repositories)

      const result = await service.replaceActiveCategoriesForAgent(agent.id, ["alpha", "beta"])

      expect(result.createdCount).toBe(2)
      expect(result.restoredCount).toBe(0)
      expect(result.deletedCount).toBe(0)

      const names = await service.listActiveCategoryNamesForAgent(agent.id)
      expect(names).toEqual(["alpha", "beta"])
    })

    it("should soft-delete categories not in the replacement set", async () => {
      const { agent } = await createOrganizationWithAgent(repositories)

      await service.replaceActiveCategoriesForAgent(agent.id, ["keep", "remove-me"])
      const result = await service.replaceActiveCategoriesForAgent(agent.id, ["keep"])

      expect(result.deletedCount).toBe(1)
      const names = await service.listActiveCategoryNamesForAgent(agent.id)
      expect(names).toEqual(["keep"])
    })

    it("should restore a soft-deleted category when it is included again", async () => {
      const { agent } = await createOrganizationWithAgent(repositories)

      await service.replaceActiveCategoriesForAgent(agent.id, ["restored", "gone"])
      await service.replaceActiveCategoriesForAgent(agent.id, ["gone"])
      const result = await service.replaceActiveCategoriesForAgent(agent.id, ["restored", "gone"])

      expect(result.restoredCount).toBe(1)
      const names = await service.listActiveCategoryNamesForAgent(agent.id)
      expect(names).toEqual(["gone", "restored"])
    })
  })
})
