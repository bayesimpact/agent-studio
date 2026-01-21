import type { Repository } from "typeorm"
import { ChatBot } from "@/chat-bots/chat-bot.entity"
import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import { organizationFactory } from "@/organizations/organization.factory"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { projectFactory } from "@/projects/project.factory"
import { User } from "@/users/user.entity"
import { ChatBotsController } from "./chat-bots.controller"
import { ChatBotsModule } from "./chat-bots.module"

describe("ChatBotsController", () => {
  let controller: ChatBotsController
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let projectRepository: Repository<Project>
  let chatBotRepository: Repository<ChatBot>

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase(
      [User, Organization, UserMembership, Project, ChatBot],
      [],
      [ChatBotsModule],
    )
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    await setup.startTransaction()
    controller = setup.module.get<ChatBotsController>(ChatBotsController)
    userRepository = setup.getRepository(User)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    projectRepository = setup.getRepository(Project)
    chatBotRepository = setup.getRepository(ChatBot)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("createChatBot", () => {
    it("should create a chat template when user is owner", async () => {
      // Arrange
      const auth0Sub = "auth0|chat-bot-ctrl-owner"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "owner@example.com",
          name: "Owner User",
        },
      }
      const org = organizationFactory.build({ name: "Owner Org" })
      const savedOrg = await organizationRepository.save(org)

      // Create user and membership
      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "owner@example.com",
        name: "Owner User",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "owner",
      })

      const project = projectFactory.build({
        name: "Owner Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const body = {
        payload: {
          name: "New Template",
          defaultPrompt: "This is a default prompt",
          projectId: savedProject.id,
        },
      }

      // Act
      const { data: result } = await controller.createChatBot(mockRequest, body)

      // Assert
      expect(result.id).toBeDefined()
      expect(result.name).toBe("New Template")
      expect(result.defaultPrompt).toBe("This is a default prompt")
      expect(result.projectId).toBe(savedProject.id)

      const template = await chatBotRepository.findOne({
        where: { id: result.id },
      })
      expect(template).not.toBeNull()
      expect(template?.name).toBe("New Template")
    })

    it("should create a chat template when user is admin", async () => {
      // Arrange
      const auth0Sub = "auth0|chat-bot-ctrl-admin"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "admin@example.com",
        },
      }
      const org = organizationFactory.build({ name: "Admin Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "admin@example.com",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "admin",
      })

      const project = projectFactory.build({
        name: "Admin Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const body = {
        payload: {
          name: "Admin Template",
          defaultPrompt: "Admin prompt",
          projectId: savedProject.id,
        },
      }

      // Act
      const { data: result } = await controller.createChatBot(mockRequest, body)

      // Assert
      expect(result.name).toBe("Admin Template")
      expect(result.defaultPrompt).toBe("Admin prompt")
      expect(result.projectId).toBe(savedProject.id)
    })

    it("should throw ForbiddenException when user is member", async () => {
      // Arrange
      const auth0Sub = "auth0|chat-bot-ctrl-member"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "member@example.com",
        },
      }
      const org = organizationFactory.build({ name: "Member Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "member@example.com",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "member",
      })

      const project = projectFactory.build({
        name: "Member Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const body = {
        payload: {
          name: "Should Fail",
          defaultPrompt: "Prompt",
          projectId: savedProject.id,
        },
      }

      // Act & Assert
      await expect(controller.createChatBot(mockRequest, body)).rejects.toThrow(
        "User must be an owner or admin",
      )
    })
  })

  describe("listChatBots", () => {
    it("should return chat templates for a project", async () => {
      // Arrange
      const auth0Sub = "auth0|chat-bot-ctrl-list"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "list@example.com",
        },
      }
      const org = organizationFactory.build({ name: "List Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "list@example.com",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "member",
      })

      const project = projectFactory.build({
        name: "List Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      // Create chat templates
      const template1 = chatBotFactory.build({
        name: "Template 1",
        defaultPrompt: "Prompt 1",
        projectId: savedProject.id,
      })
      const template2 = chatBotFactory.build({
        name: "Template 2",
        defaultPrompt: "Prompt 2",
        projectId: savedProject.id,
      })
      await chatBotRepository.save([template1, template2])

      // Act
      const { data: result } = await controller.listChatBots(mockRequest, savedProject.id)

      // Assert
      expect(result.chatBots).toHaveLength(2)
      expect(result.chatBots.map((t) => t.name)).toContain("Template 1")
      expect(result.chatBots.map((t) => t.name)).toContain("Template 2")
      expect(result.chatBots[0]).toHaveProperty("id")
      expect(result.chatBots[0]).toHaveProperty("createdAt")
      expect(result.chatBots[0]).toHaveProperty("updatedAt")
    })

    it("should return empty array when project has no chat templates", async () => {
      // Arrange
      const auth0Sub = "auth0|chat-bot-ctrl-empty"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "empty@example.com",
        },
      }
      const org = organizationFactory.build({ name: "Empty Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "empty@example.com",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "member",
      })

      const project = projectFactory.build({
        name: "Empty Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      // Act
      const { data: result } = await controller.listChatBots(mockRequest, savedProject.id)

      // Assert
      expect(result.chatBots).toEqual([])
    })

    it("should throw ForbiddenException when user is not a member", async () => {
      // Arrange
      const auth0Sub = "auth0|chat-bot-ctrl-nonmember"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "nonmember@example.com",
        },
      }
      const org = organizationFactory.build({ name: "Other Org" })
      const savedOrg = await organizationRepository.save(org)

      await userRepository.save({
        auth0Id: auth0Sub,
        email: "nonmember@example.com",
      })
      // No membership created

      const project = projectFactory.build({
        name: "Other Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      // Act & Assert
      await expect(controller.listChatBots(mockRequest, savedProject.id)).rejects.toThrow(
        "User does not have access to organization",
      )
    })
  })

  describe("updateChatBot", () => {
    it("should update a chat template when user is owner", async () => {
      // Arrange
      const auth0Sub = "auth0|chat-bot-ctrl-update-owner"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "owner@example.com",
          name: "Owner User",
        },
      }
      const org = organizationFactory.build({ name: "Update Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "owner@example.com",
        name: "Owner User",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "owner",
      })

      const project = projectFactory.build({
        name: "Update Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatBotFactory.build({
        name: "Original Template",
        defaultPrompt: "Original Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatBotRepository.save(template)

      const body = {
        payload: {
          name: "Updated Template",
          defaultPrompt: "Updated Prompt",
        },
      }

      // Act
      const { data: result } = await controller.updateChatBot(mockRequest, savedTemplate.id, body)

      // Assert
      expect(result.id).toBe(savedTemplate.id)
      expect(result.name).toBe("Updated Template")
      expect(result.defaultPrompt).toBe("Updated Prompt")
      expect(result.projectId).toBe(savedProject.id)

      const updatedTemplate = await chatBotRepository.findOne({
        where: { id: savedTemplate.id },
      })
      expect(updatedTemplate?.name).toBe("Updated Template")
    })

    it("should update a chat template when user is admin", async () => {
      // Arrange
      const auth0Sub = "auth0|chat-bot-ctrl-update-admin"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "admin@example.com",
        },
      }
      const org = organizationFactory.build({ name: "Admin Update Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "admin@example.com",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "admin",
      })

      const project = projectFactory.build({
        name: "Admin Update Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatBotFactory.build({
        name: "Original Template",
        defaultPrompt: "Original Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatBotRepository.save(template)

      const body = {
        payload: {
          name: "Admin Updated Template",
        },
      }

      // Act
      const { data: result } = await controller.updateChatBot(mockRequest, savedTemplate.id, body)

      // Assert
      expect(result.name).toBe("Admin Updated Template")
      expect(result.defaultPrompt).toBe("Original Prompt") // Unchanged
    })

    it("should throw ForbiddenException when user is member", async () => {
      // Arrange
      const auth0Sub = "auth0|chat-bot-ctrl-update-member"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "member@example.com",
        },
      }
      const org = organizationFactory.build({ name: "Member Update Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "member@example.com",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "member",
      })

      const project = projectFactory.build({
        name: "Member Update Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatBotFactory.build({
        name: "Template",
        defaultPrompt: "Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatBotRepository.save(template)

      const body = {
        payload: {
          name: "Should Not Update",
        },
      }

      // Act & Assert
      await expect(controller.updateChatBot(mockRequest, savedTemplate.id, body)).rejects.toThrow(
        "User must be an owner or admin",
      )

      // Verify template unchanged
      const unchangedTemplate = await chatBotRepository.findOne({
        where: { id: savedTemplate.id },
      })
      expect(unchangedTemplate?.name).toBe("Template")
    })

    it("should throw NotFoundException when chat template does not exist", async () => {
      // Arrange
      const auth0Sub = "auth0|chat-bot-ctrl-update-notfound"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "user@example.com",
        },
      }
      const nonExistentTemplateId = "00000000-0000-0000-0000-000000000000"

      const body = {
        payload: {
          name: "Updated",
        },
      }

      // Act & Assert
      await expect(
        controller.updateChatBot(mockRequest, nonExistentTemplateId, body),
      ).rejects.toThrow("Chat template with id")
    })
  })

  describe("deleteChatBot", () => {
    it("should delete a chat template when user is owner", async () => {
      // Arrange
      const auth0Sub = "auth0|chat-bot-ctrl-delete-owner"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "owner@example.com",
          name: "Owner User",
        },
      }
      const org = organizationFactory.build({ name: "Delete Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "owner@example.com",
        name: "Owner User",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "owner",
      })

      const project = projectFactory.build({
        name: "Delete Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatBotFactory.build({
        name: "Template to Delete",
        defaultPrompt: "Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatBotRepository.save(template)

      // Act
      const { data: result } = await controller.deleteChatBot(mockRequest, savedTemplate.id)

      // Assert
      expect(result.success).toBe(true)

      const deletedTemplate = await chatBotRepository.findOne({
        where: { id: savedTemplate.id },
      })
      expect(deletedTemplate).toBeNull()
    })

    it("should delete a chat template when user is admin", async () => {
      // Arrange
      const auth0Sub = "auth0|chat-bot-ctrl-delete-admin"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "admin@example.com",
        },
      }
      const org = organizationFactory.build({ name: "Admin Delete Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "admin@example.com",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "admin",
      })

      const project = projectFactory.build({
        name: "Admin Delete Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatBotFactory.build({
        name: "Admin Template to Delete",
        defaultPrompt: "Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatBotRepository.save(template)

      // Act
      const { data: result } = await controller.deleteChatBot(mockRequest, savedTemplate.id)

      // Assert
      expect(result.success).toBe(true)

      const deletedTemplate = await chatBotRepository.findOne({
        where: { id: savedTemplate.id },
      })
      expect(deletedTemplate).toBeNull()
    })

    it("should throw ForbiddenException when user is member", async () => {
      // Arrange
      const auth0Sub = "auth0|chat-bot-ctrl-delete-member"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "member@example.com",
        },
      }
      const org = organizationFactory.build({ name: "Member Delete Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "member@example.com",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "member",
      })

      const project = projectFactory.build({
        name: "Member Delete Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatBotFactory.build({
        name: "Should Not Delete",
        defaultPrompt: "Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatBotRepository.save(template)

      // Act & Assert
      await expect(controller.deleteChatBot(mockRequest, savedTemplate.id)).rejects.toThrow(
        "User must be an owner or admin",
      )

      // Verify template still exists
      const existingTemplate = await chatBotRepository.findOne({
        where: { id: savedTemplate.id },
      })
      expect(existingTemplate).not.toBeNull()
    })

    it("should throw NotFoundException when chat template does not exist", async () => {
      // Arrange
      const auth0Sub = "auth0|chat-bot-ctrl-delete-notfound"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "user@example.com",
        },
      }
      const nonExistentTemplateId = "00000000-0000-0000-0000-000000000000"

      // Act & Assert
      await expect(controller.deleteChatBot(mockRequest, nonExistentTemplateId)).rejects.toThrow(
        "Chat template with id",
      )
    })
  })
})
