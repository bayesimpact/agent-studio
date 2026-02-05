import { AgentLocale, AgentModel } from "@caseai-connect/api-contracts"
import { ForbiddenException, NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { Agent } from "@/agents/agent.entity"
import { agentFactory } from "@/agents/agent.factory"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import {
  createOrganizationWithAgent,
  createOrganizationWithOwner,
  createOrganizationWithProject,
  organizationFactory,
} from "@/organizations/organization.factory"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { projectFactory } from "@/projects/project.factory"
import { User } from "@/users/user.entity"
import { userFactory } from "@/users/user.factory"
import { AgentsModule } from "./agents.module"
import { AgentsService } from "./agents.service"

describe("AgentsService", () => {
  let service: AgentsService
  let agentRepository: Repository<Agent>
  let projectRepository: Repository<Project>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let userRepository: Repository<User>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      featureEntities: [Agent, Project, Organization, UserMembership, User],
      additionalImports: [AgentsModule],
    })
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    await setup.startTransaction()
    service = setup.module.get<AgentsService>(AgentsService)
    agentRepository = setup.getRepository(Agent)
    projectRepository = setup.getRepository(Project)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    userRepository = setup.getRepository(User)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  describe("createAgent", () => {
    it("should create an Agent when user is owner", async () => {
      const { user, project } = await createOrganizationWithProject({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
      })

      const result = await service.createAgent({
        userId: user.id,
        projectId: project.id,
        name: "My Template",
        defaultPrompt: "This is a default prompt",
        model: AgentModel.Gemini25Flash,
        temperature: 0,
        locale: AgentLocale.EN,
      })

      // Assert
      expect(result.name).toBe("My Template")
      expect(result.defaultPrompt).toBe("This is a default prompt")
      expect(result.projectId).toBe(project.id)
      expect(result.id).toBeDefined()

      const savedTemplate = await agentRepository.findOne({
        where: { id: result.id },
      })
      expect(savedTemplate).not.toBeNull()
      expect(savedTemplate?.name).toBe("My Template")
    })

    it("should create an Agent when user is admin", async () => {
      const { user, project } = await createOrganizationWithProject(
        {
          organizationRepository,
          userRepository,
          membershipRepository,
          projectRepository,
        },
        { membership: { role: "admin" } },
      )

      // Act
      const result = await service.createAgent({
        userId: user.id,
        projectId: project.id,
        name: "Admin Template",
        defaultPrompt: "Admin prompt",
        model: AgentModel.Gemini25Flash,
        temperature: 0,
        locale: AgentLocale.EN,
      })

      // Assert
      expect(result.name).toBe("Admin Template")
      expect(result.defaultPrompt).toBe("Admin prompt")
    })

    it("should throw ForbiddenException when name is less than 3 characters", async () => {
      const { user, project } = await createOrganizationWithProject({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
      })

      const createWrongfulAgent = async () =>
        service.createAgent({
          userId: user.id,
          projectId: project.id,
          name: "AB",
          defaultPrompt: "Prompt",
          model: AgentModel.Gemini25Flash,
          temperature: 0,
          locale: AgentLocale.EN,
        })

      // Act & Assert
      await expect(createWrongfulAgent()).rejects.toThrow(ForbiddenException)
      await expect(createWrongfulAgent()).rejects.toThrow(
        "Agent name must be at least 3 characters long",
      )
    })

    it("should throw ForbiddenException when user is not a member", async () => {
      const { project } = await createOrganizationWithProject({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
      })
      const anotherUser = userFactory.build({
        email: "another@example.com",
        auth0Id: "auth0|agent-another-1",
      })
      await userRepository.save(anotherUser)

      const createWrongfulAgent = async () =>
        service.createAgent({
          userId: anotherUser.id,
          projectId: project.id,
          name: "Template",
          defaultPrompt: "Prompt",
          model: AgentModel.Gemini25Flash,
          temperature: 0,
          locale: AgentLocale.EN,
        })

      // Act & Assert
      await expect(createWrongfulAgent()).rejects.toThrow(ForbiddenException)
      await expect(createWrongfulAgent()).rejects.toThrow(
        "User does not have access to organization",
      )
    })

    it("should throw ForbiddenException when user is member but not owner or admin", async () => {
      const { user, project } = await createOrganizationWithProject(
        {
          organizationRepository,
          userRepository,
          membershipRepository,
          projectRepository,
        },
        { membership: { role: "member" } },
      )

      const createWrongfulAgent = async () =>
        service.createAgent({
          userId: user.id,
          projectId: project.id,
          name: "Template",
          defaultPrompt: "Prompt",
          model: AgentModel.Gemini25Flash,
          temperature: 0,
          locale: AgentLocale.EN,
        })

      // Act & Assert
      await expect(createWrongfulAgent()).rejects.toThrow(ForbiddenException)
      await expect(createWrongfulAgent()).rejects.toThrow("User must be an owner or admin")
    })

    it("should throw NotFoundException when project does not exist", async () => {
      const { user } = await createOrganizationWithOwner({
        organizationRepository,
        userRepository,
        membershipRepository,
      })
      const nonExistentProjectId = "00000000-0000-0000-0000-000000000000"

      const createWrongfulAgent = async () =>
        service.createAgent({
          userId: user.id,
          projectId: nonExistentProjectId,
          name: "Template",
          defaultPrompt: "Prompt",
          model: AgentModel.Gemini25Flash,
          temperature: 0,
          locale: AgentLocale.EN,
        })

      // Act & Assert
      await expect(createWrongfulAgent()).rejects.toThrow(NotFoundException)
      await expect(createWrongfulAgent()).rejects.toThrow("Project with id")
    })
  })

  describe("listAgents", () => {
    it("should return Agents for a project", async () => {
      const { user, project } = await createOrganizationWithProject({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
      })

      const template1 = agentFactory.transient({ project }).build({
        name: "Template 1",
        defaultPrompt: "Prompt 1",
      })
      const template2 = agentFactory.transient({ project }).build({
        name: "Template 2",
        defaultPrompt: "Prompt 2",
      })
      await agentRepository.save([template1, template2])

      // Act
      const result = await service.listAgents({ userId: user.id, projectId: project.id })

      // Assert
      expect(result).toHaveLength(2)
      expect(result.map((t) => t.name)).toContain("Template 1")
      expect(result.map((t) => t.name)).toContain("Template 2")
    })

    it("should return empty array when project has no Agents", async () => {
      const { user, project } = await createOrganizationWithProject({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
      })

      // Act
      const result = await service.listAgents({ userId: user.id, projectId: project.id })

      // Assert
      expect(result).toEqual([])
    })

    it("should throw ForbiddenException when user is not a member", async () => {
      // Arrange
      const user = userFactory.build({ email: "nonmember@example.com" })
      await userRepository.save(user)
      const organization = organizationFactory.build({ name: "Other Org" })
      await organizationRepository.save(organization)

      const project = projectFactory.transient({ organization }).build({
        name: "Other Project",
      })
      await projectRepository.save(project)

      const createWrongfulListAgents = async () =>
        service.listAgents({ userId: user.id, projectId: project.id })

      // Act & Assert
      await expect(createWrongfulListAgents()).rejects.toThrow(ForbiddenException)
      await expect(createWrongfulListAgents()).rejects.toThrow(
        "User does not have access to organization",
      )
    })

    it("should return Agents ordered by createdAt DESC", async () => {
      const { user, project } = await createOrganizationWithProject({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
      })

      const template1 = agentFactory.transient({ project }).build({
        name: "First Template",
        defaultPrompt: "Prompt 1",
        createdAt: new Date("2024-01-02"),
      })
      const template2 = agentFactory.transient({ project }).build({
        name: "Second Template",
        defaultPrompt: "Prompt 2",
      })
      await agentRepository.save([template1, template2])

      // Act
      const result = await service.listAgents({ userId: user.id, projectId: project.id })

      // Assert
      expect(result).toHaveLength(2)
      const [first, second] = result
      expect(first!.name).toBe("Second Template") // Most recent first
      expect(second!.name).toBe("First Template")
    })
  })

  describe("updateAgent", () => {
    it("should update an Agent when user is owner", async () => {
      const { user, agent } = await createOrganizationWithAgent({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
        agentRepository,
      })

      // Act
      const result = await service.updateAgent({
        required: { userId: user.id, agentId: agent.id },
        fieldsToUpdate: {
          name: "Updated Template",
          defaultPrompt: "Updated Prompt",
        },
      })

      // Assert
      expect(result.name).toBe("Updated Template")
      expect(result.defaultPrompt).toBe("Updated Prompt")
      expect(result.id).toBe(agent.id)

      const updatedTemplate = await agentRepository.findOne({ where: { id: agent.id } })
      expect(updatedTemplate?.name).toBe("Updated Template")
      expect(updatedTemplate?.defaultPrompt).toBe("Updated Prompt")
    })

    it("should update only name when defaultPrompt is not provided", async () => {
      const { user, agent } = await createOrganizationWithAgent(
        {
          organizationRepository,
          userRepository,
          membershipRepository,
          projectRepository,
          agentRepository,
        },
        { agent: { defaultPrompt: "Original Prompt" } },
      )

      // Act
      const result = await service.updateAgent({
        required: { userId: user.id, agentId: agent.id },
        fieldsToUpdate: { name: "Updated Name" },
      })

      // Assert
      expect(result.name).toBe("Updated Name")
      expect(result.defaultPrompt).toBe("Original Prompt") // Unchanged
    })

    it("should throw ForbiddenException when name is less than 3 characters", async () => {
      const { user, agent } = await createOrganizationWithAgent({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
        agentRepository,
      })

      const createWrongfulUpdateAgent = async () =>
        service.updateAgent({
          required: { userId: user.id, agentId: agent.id },
          fieldsToUpdate: { name: "AB" },
        })

      // Act & Assert
      await expect(createWrongfulUpdateAgent()).rejects.toThrow(ForbiddenException)
      await expect(createWrongfulUpdateAgent()).rejects.toThrow(
        "Agent name must be at least 3 characters long",
      )
    })

    it("should throw ForbiddenException when user is member but not owner or admin", async () => {
      const { user, agent } = await createOrganizationWithAgent(
        {
          organizationRepository,
          userRepository,
          membershipRepository,
          projectRepository,
          agentRepository,
        },
        { membership: { role: "member" } },
      )

      const createWrongfulUpdateAgent = async () =>
        service.updateAgent({
          required: { userId: user.id, agentId: agent.id },
          fieldsToUpdate: { name: "Updated" },
        })

      // Act & Assert
      await expect(createWrongfulUpdateAgent()).rejects.toThrow(ForbiddenException)
      await expect(createWrongfulUpdateAgent()).rejects.toThrow("User must be an owner or admin")
    })

    it("should throw NotFoundException when agent does not exist", async () => {
      const user = userFactory.build()
      await userRepository.save(user)
      const nonExistentTemplateId = "00000000-0000-0000-0000-000000000000"

      const createWrongfulUpdateAgent = async () =>
        service.updateAgent({
          required: { userId: user.id, agentId: nonExistentTemplateId },
          fieldsToUpdate: { name: "Updated" },
        })

      // Act & Assert
      await expect(createWrongfulUpdateAgent()).rejects.toThrow(NotFoundException)
      await expect(createWrongfulUpdateAgent()).rejects.toThrow("Agent with id")
    })
  })

  describe("deleteAgent", () => {
    it("should delete an Agent when user is owner", async () => {
      const { user, agent } = await createOrganizationWithAgent({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
        agentRepository,
      })

      // Act
      await service.deleteAgent(user.id, agent.id)

      // Assert
      const deletedTemplate = await agentRepository.findOne({ where: { id: agent.id } })
      expect(deletedTemplate).toBeNull()
    })

    it("should delete a Agent when user is admin", async () => {
      const { user, agent } = await createOrganizationWithAgent(
        {
          organizationRepository,
          userRepository,
          membershipRepository,
          projectRepository,
          agentRepository,
        },
        { membership: { role: "admin" } },
      )

      // Act
      await service.deleteAgent(user.id, agent.id)

      // Assert
      const deletedTemplate = await agentRepository.findOne({ where: { id: agent.id } })
      expect(deletedTemplate).toBeNull()
    })

    it("should throw ForbiddenException when user is member", async () => {
      const { user, agent } = await createOrganizationWithAgent(
        {
          organizationRepository,
          userRepository,
          membershipRepository,
          projectRepository,
          agentRepository,
        },
        { membership: { role: "member" } },
      )

      // Act & Assert
      await expect(service.deleteAgent(user.id, agent.id)).rejects.toThrow(ForbiddenException)
      await expect(service.deleteAgent(user.id, agent.id)).rejects.toThrow(
        "User must be an owner or admin",
      )

      // Verify template still exists
      const existingTemplate = await agentRepository.findOne({ where: { id: agent.id } })
      expect(existingTemplate).not.toBeNull()
    })

    it("should throw NotFoundException when agent does not exist", async () => {
      // Arrange
      const user = userFactory.build()
      await userRepository.save(user)
      const nonExistentTemplateId = "00000000-0000-0000-0000-000000000000"

      // Act & Assert
      await expect(service.deleteAgent(user.id, nonExistentTemplateId)).rejects.toThrow(
        NotFoundException,
      )
      await expect(service.deleteAgent(user.id, nonExistentTemplateId)).rejects.toThrow(
        "Agent with id",
      )
    })

    it("should throw ForbiddenException when user is not a member", async () => {
      const { agent } = await createOrganizationWithAgent({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
        agentRepository,
      })
      const anotherUser = userFactory.build()
      await userRepository.save(anotherUser)

      const createWrongfulDeleteAgent = async () => service.deleteAgent(anotherUser.id, agent.id)

      // Act & Assert
      await expect(createWrongfulDeleteAgent()).rejects.toThrow(ForbiddenException)
      await expect(createWrongfulDeleteAgent()).rejects.toThrow(
        "User does not have access to organization",
      )

      // Verify template still exists
      const existingTemplate = await agentRepository.findOne({ where: { id: agent.id } })
      expect(existingTemplate).not.toBeNull()
    })
  })
})
