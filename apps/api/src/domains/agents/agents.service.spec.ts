import { AgentLocale, AgentModel } from "@caseai-connect/api-contracts"
import { afterAll } from "@jest/globals"
import { UnprocessableEntityException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import type { Agent } from "@/domains/agents/agent.entity"
import { agentFactory } from "@/domains/agents/agent.factory"
import type { Organization } from "@/domains/organizations/organization.entity"
import {
  createOrganizationWithAgent,
  createOrganizationWithProject,
} from "@/domains/organizations/organization.factory"
import type { UserMembership } from "@/domains/organizations/user-membership.entity"
import type { Project } from "@/domains/projects/project.entity"
import type { User } from "@/domains/users/user.entity"
import { sdk } from "@/external/llm/open-telemetry-init.ts"
import { AgentsModule } from "./agents.module"
import { AgentsService } from "./agents.service"

describe("AgentsService", () => {
  let service: AgentsService
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: {
    agentRepository: Repository<Agent>
    projectRepository: Repository<Project>
    organizationRepository: Repository<Organization>
    membershipRepository: Repository<UserMembership>
    userRepository: Repository<User>
  }

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [AgentsModule],
    })
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    await sdk.shutdown()
  })

  beforeEach(async () => {
    await setup.startTransaction()
    service = setup.module.get<AgentsService>(AgentsService)
    repositories = setup.getAllRepositories()
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  describe("createAgent", () => {
    it("should create an Agent", async () => {
      const { organization, project } = await createOrganizationWithProject(repositories)

      const result = await service.createAgent({
        connectScope: {
          organizationId: organization.id,
          projectId: project.id,
        },
        fields: {
          name: "My Template",
          defaultPrompt: "This is a default prompt",
          model: AgentModel.Gemini25Flash,
          temperature: 0,
          locale: AgentLocale.EN,
        },
      })

      // Assert
      expect(result.name).toBe("My Template")
      expect(result.defaultPrompt).toBe("This is a default prompt")
      expect(result.projectId).toBe(project.id)
      expect(result.id).toBeDefined()

      const savedTemplate = await repositories.agentRepository.findOne({
        where: { id: result.id },
      })
      expect(savedTemplate).not.toBeNull()
      expect(savedTemplate?.name).toBe("My Template")
    })
    it("should throw UnprocessableEntityException when name is less than 3 characters", async () => {
      const { organization, project } = await createOrganizationWithProject(repositories)

      const createWrongfulAgent = async () =>
        service.createAgent({
          connectScope: {
            organizationId: organization.id,
            projectId: project.id,
          },
          fields: {
            name: "AB",
            defaultPrompt: "Prompt",
            model: AgentModel.Gemini25Flash,
            temperature: 0,
            locale: AgentLocale.EN,
          },
        })

      // Act & Assert
      await expect(createWrongfulAgent()).rejects.toThrow(UnprocessableEntityException)
      await expect(createWrongfulAgent()).rejects.toThrow(
        "Agent name must be at least 3 characters long",
      )
    })
  })

  describe("listAgents", () => {
    it("should return Agents for a project", async () => {
      const { organization, project } = await createOrganizationWithProject(repositories)

      const template1 = agentFactory.transient({ organization, project }).build({
        name: "Template 1",
        defaultPrompt: "Prompt 1",
      })
      const template2 = agentFactory.transient({ organization, project }).build({
        name: "Template 2",
        defaultPrompt: "Prompt 2",
      })
      await repositories.agentRepository.save([template1, template2])

      // Act
      const result = await service.listAgents({
        organizationId: organization.id,
        projectId: project.id,
      })

      // Assert
      expect(result).toHaveLength(2)
      expect(result.map((t) => t.name)).toContain("Template 1")
      expect(result.map((t) => t.name)).toContain("Template 2")
    })

    it("should return empty array when project has no Agents", async () => {
      const { organization, project } = await createOrganizationWithProject(repositories)

      // Act
      const result = await service.listAgents({
        organizationId: organization.id,
        projectId: project.id,
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return Agents ordered by createdAt DESC", async () => {
      const { organization, project } = await createOrganizationWithProject(repositories)

      const template1 = agentFactory.transient({ organization, project }).build({
        name: "First Template",
        defaultPrompt: "Prompt 1",
        createdAt: new Date("2024-01-02"),
      })
      const template2 = agentFactory.transient({ organization, project }).build({
        name: "Second Template",
        defaultPrompt: "Prompt 2",
      })
      await repositories.agentRepository.save([template1, template2])

      // Act
      const result = await service.listAgents({
        organizationId: organization.id,
        projectId: project.id,
      })

      // Assert
      expect(result).toHaveLength(2)
      const [first, second] = result
      expect(first!.name).toBe("Second Template") // Most recent first
      expect(second!.name).toBe("First Template")
    })
  })

  describe("updateAgent", () => {
    it("should update an Agent", async () => {
      const { organization, project, agent } = await createOrganizationWithAgent(repositories)

      // Act
      const result = await service.updateAgent({
        connectScope: { organizationId: organization.id, projectId: project.id },
        required: { agentId: agent.id },
        fieldsToUpdate: {
          name: "Updated Template",
          defaultPrompt: "Updated Prompt",
        },
      })

      // Assert
      expect(result.name).toBe("Updated Template")
      expect(result.defaultPrompt).toBe("Updated Prompt")
      expect(result.id).toBe(agent.id)

      const updatedTemplate = await repositories.agentRepository.findOne({
        where: { id: agent.id },
      })
      expect(updatedTemplate?.name).toBe("Updated Template")
      expect(updatedTemplate?.defaultPrompt).toBe("Updated Prompt")
    })

    it("should update only name when defaultPrompt is not provided", async () => {
      const { organization, project, agent } = await createOrganizationWithAgent(repositories, {
        agent: { defaultPrompt: "Original Prompt" },
      })

      // Act
      const result = await service.updateAgent({
        connectScope: { organizationId: organization.id, projectId: project.id },
        required: { agentId: agent.id },
        fieldsToUpdate: { name: "Updated Name" },
      })

      // Assert
      expect(result.name).toBe("Updated Name")
      expect(result.defaultPrompt).toBe("Original Prompt") // Unchanged
    })

    it("should throw UnprocessableEntityException when name is less than 3 characters", async () => {
      const { organization, project, agent } = await createOrganizationWithAgent(repositories)

      const createWrongfulUpdateAgent = async () =>
        service.updateAgent({
          connectScope: { organizationId: organization.id, projectId: project.id },
          required: { agentId: agent.id },
          fieldsToUpdate: { name: "AB" },
        })

      // Act & Assert
      await expect(createWrongfulUpdateAgent()).rejects.toThrow(UnprocessableEntityException)
      await expect(createWrongfulUpdateAgent()).rejects.toThrow(
        "Agent name must be at least 3 characters long",
      )
    })
  })

  describe("deleteAgent", () => {
    it("should delete an Agent", async () => {
      const { organization, project, agent } = await createOrganizationWithAgent(repositories)

      // Act
      await service.deleteAgent({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
      })

      // Assert
      const deletedTemplate = await repositories.agentRepository.findOne({
        where: { id: agent.id },
      })
      expect(deletedTemplate).toBeNull()
    })
  })
})
