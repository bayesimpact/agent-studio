import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { agentFactory } from "@/domains/agents/agent.factory"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { McpServersModule } from "./mcp-servers.module"
import { McpServersService } from "./mcp-servers.service"

describe("McpServersService", () => {
  let service: McpServersService
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [McpServersModule],
    })
    await clearTestDatabase(setup.dataSource)
    repositories = setup.getAllRepositories()
    service = setup.module.get<McpServersService>(McpServersService)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  afterEach(async () => {
    await clearTestDatabase(setup.dataSource)
  })

  describe("createPreset", () => {
    it("should create a preset MCP server with encrypted config", async () => {
      const server = await service.createPreset("create-test", "Test Server", {
        url: "https://example.com/mcp",
        apiKey: "sk-test-key",
      })

      expect(server.id).toBeDefined()
      expect(server.name).toBe("Test Server")
      expect(server.presetSlug).toBe("create-test")
      expect(server.projectId).toBeNull()
      expect(server.encryptedConfig).not.toContain("sk-test-key")

      const saved = await repositories.mcpServerRepository.findOne({
        where: { id: server.id },
      })
      expect(saved).not.toBeNull()
      expect(saved?.encryptedConfig).not.toContain("sk-test-key")
    })
  })

  describe("enableForAgent", () => {
    it("should create an agent-mcp-server junction", async () => {
      const { organization, project } = await createOrganizationWithProject(repositories)
      const agent = agentFactory.transient({ organization, project }).build()
      await repositories.agentRepository.save(agent)

      const server = await service.createPreset("enable-test", "Test Server", {
        url: "https://example.com/mcp",
        apiKey: "sk-test-key",
      })

      const result = await service.enableForAgent(agent.id, server.id)

      expect(result.agentId).toBe(agent.id)
      expect(result.mcpServerId).toBe(server.id)
      expect(result.enabled).toBe(true)
    })
  })

  describe("getEnabledServersForAgent", () => {
    it("should return decrypted configs for enabled servers", async () => {
      const { organization, project } = await createOrganizationWithProject(repositories)
      const agent = agentFactory.transient({ organization, project }).build()
      await repositories.agentRepository.save(agent)

      const server = await service.createPreset("get-enabled-test", "Test Server", {
        url: "https://example.com/mcp",
        apiKey: "sk-test-key",
      })
      await service.enableForAgent(agent.id, server.id)

      const configs = await service.getEnabledServersForAgent(agent.id)

      expect(configs).toHaveLength(1)
      expect(configs[0]).toEqual({
        url: "https://example.com/mcp",
        apiKey: "sk-test-key",
      })
    })

    it("should not return disabled servers", async () => {
      const { organization, project } = await createOrganizationWithProject(repositories)
      const agent = agentFactory.transient({ organization, project }).build()
      await repositories.agentRepository.save(agent)

      const server = await service.createPreset("disabled-test", "Test Server", {
        url: "https://example.com/mcp",
        apiKey: "sk-test-key",
      })
      const junction = await service.enableForAgent(agent.id, server.id)
      await repositories.agentMcpServerRepository.update(junction.id, { enabled: false })

      const configs = await service.getEnabledServersForAgent(agent.id)

      expect(configs).toHaveLength(0)
    })

    it("should return multiple servers", async () => {
      const { organization, project } = await createOrganizationWithProject(repositories)
      const agent = agentFactory.transient({ organization, project }).build()
      await repositories.agentRepository.save(agent)

      const server1 = await service.createPreset("multi-social", "Bayes Social", {
        url: "https://social.example.com/mcp",
        apiKey: "sk-social",
      })
      const server2 = await service.createPreset("multi-other", "Other Server", {
        url: "https://other.example.com/mcp",
      })
      await service.enableForAgent(agent.id, server1.id)
      await service.enableForAgent(agent.id, server2.id)

      const configs = await service.getEnabledServersForAgent(agent.id)

      expect(configs).toHaveLength(2)
      expect(configs).toEqual(
        expect.arrayContaining([
          { url: "https://social.example.com/mcp", apiKey: "sk-social" },
          { url: "https://other.example.com/mcp" },
        ]),
      )
    })
  })
})
