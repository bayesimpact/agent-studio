import { ChatBotLocale, ChatBotModel } from "@caseai-connect/api-contracts"
import { ForbiddenException, NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { ChatBot } from "@/chat-bots/chat-bot.entity"
import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import {
  createOrganizationWithChatBot,
  createOrganizationWithOwner,
  createOrganizationWithProject,
  organizationFactory,
} from "@/organizations/organization.factory"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { projectFactory } from "@/projects/project.factory"
import { User } from "@/users/user.entity"
import { userFactory } from "@/users/user.factory"
import { ChatBotsModule } from "./chat-bots.module"
import { ChatBotsService } from "./chat-bots.service"

describe("ChatBotsService", () => {
  let service: ChatBotsService
  let chatBotRepository: Repository<ChatBot>
  let projectRepository: Repository<Project>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let userRepository: Repository<User>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      featureEntities: [ChatBot, Project, Organization, UserMembership, User],
      additionalImports: [ChatBotsModule],
    })
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    await setup.startTransaction()
    service = setup.module.get<ChatBotsService>(ChatBotsService)
    chatBotRepository = setup.getRepository(ChatBot)
    projectRepository = setup.getRepository(Project)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    userRepository = setup.getRepository(User)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  describe("createChatBot", () => {
    it("should create a ChatBot when user is owner", async () => {
      const { user, project } = await createOrganizationWithProject({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
      })

      const result = await service.createChatBot({
        userId: user.id,
        projectId: project.id,
        name: "My Template",
        defaultPrompt: "This is a default prompt",
        model: ChatBotModel.Gemini25Flash,
        temperature: 0,
        locale: ChatBotLocale.EN,
      })

      // Assert
      expect(result.name).toBe("My Template")
      expect(result.defaultPrompt).toBe("This is a default prompt")
      expect(result.projectId).toBe(project.id)
      expect(result.id).toBeDefined()

      const savedTemplate = await chatBotRepository.findOne({
        where: { id: result.id },
      })
      expect(savedTemplate).not.toBeNull()
      expect(savedTemplate?.name).toBe("My Template")
    })

    it("should create a ChatBot when user is admin", async () => {
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
      const result = await service.createChatBot({
        userId: user.id,
        projectId: project.id,
        name: "Admin Template",
        defaultPrompt: "Admin prompt",
        model: ChatBotModel.Gemini25Flash,
        temperature: 0,
        locale: ChatBotLocale.EN,
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

      const createWrongfulChatBot = async () =>
        service.createChatBot({
          userId: user.id,
          projectId: project.id,
          name: "AB",
          defaultPrompt: "Prompt",
          model: ChatBotModel.Gemini25Flash,
          temperature: 0,
          locale: ChatBotLocale.EN,
        })

      // Act & Assert
      await expect(createWrongfulChatBot()).rejects.toThrow(ForbiddenException)
      await expect(createWrongfulChatBot()).rejects.toThrow(
        "ChatBot name must be at least 3 characters long",
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
        auth0Id: "auth0|chat-bot-another-1",
      })
      await userRepository.save(anotherUser)

      const createWrongfulChatBot = async () =>
        service.createChatBot({
          userId: anotherUser.id,
          projectId: project.id,
          name: "Template",
          defaultPrompt: "Prompt",
          model: ChatBotModel.Gemini25Flash,
          temperature: 0,
          locale: ChatBotLocale.EN,
        })

      // Act & Assert
      await expect(createWrongfulChatBot()).rejects.toThrow(ForbiddenException)
      await expect(createWrongfulChatBot()).rejects.toThrow(
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

      const createWrongfulChatBot = async () =>
        service.createChatBot({
          userId: user.id,
          projectId: project.id,
          name: "Template",
          defaultPrompt: "Prompt",
          model: ChatBotModel.Gemini25Flash,
          temperature: 0,
          locale: ChatBotLocale.EN,
        })

      // Act & Assert
      await expect(createWrongfulChatBot()).rejects.toThrow(ForbiddenException)
      await expect(createWrongfulChatBot()).rejects.toThrow("User must be an owner or admin")
    })

    it("should throw NotFoundException when project does not exist", async () => {
      const { user } = await createOrganizationWithOwner({
        organizationRepository,
        userRepository,
        membershipRepository,
      })
      const nonExistentProjectId = "00000000-0000-0000-0000-000000000000"

      const createWrongfulChatBot = async () =>
        service.createChatBot({
          userId: user.id,
          projectId: nonExistentProjectId,
          name: "Template",
          defaultPrompt: "Prompt",
          model: ChatBotModel.Gemini25Flash,
          temperature: 0,
          locale: ChatBotLocale.EN,
        })

      // Act & Assert
      await expect(createWrongfulChatBot()).rejects.toThrow(NotFoundException)
      await expect(createWrongfulChatBot()).rejects.toThrow("Project with id")
    })
  })

  describe("listChatBots", () => {
    it("should return ChatBots for a project", async () => {
      const { user, project } = await createOrganizationWithProject({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
      })

      const template1 = chatBotFactory.transient({ project }).build({
        name: "Template 1",
        defaultPrompt: "Prompt 1",
      })
      const template2 = chatBotFactory.transient({ project }).build({
        name: "Template 2",
        defaultPrompt: "Prompt 2",
      })
      await chatBotRepository.save([template1, template2])

      // Act
      const result = await service.listChatBots({ userId: user.id, projectId: project.id })

      // Assert
      expect(result).toHaveLength(2)
      expect(result.map((t) => t.name)).toContain("Template 1")
      expect(result.map((t) => t.name)).toContain("Template 2")
    })

    it("should return empty array when project has no ChatBots", async () => {
      const { user, project } = await createOrganizationWithProject({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
      })

      // Act
      const result = await service.listChatBots({ userId: user.id, projectId: project.id })

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

      const createWrongfulListChatBots = async () =>
        service.listChatBots({ userId: user.id, projectId: project.id })

      // Act & Assert
      await expect(createWrongfulListChatBots()).rejects.toThrow(ForbiddenException)
      await expect(createWrongfulListChatBots()).rejects.toThrow(
        "User does not have access to organization",
      )
    })

    it("should return ChatBots ordered by createdAt DESC", async () => {
      const { user, project } = await createOrganizationWithProject({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
      })

      const template1 = chatBotFactory.transient({ project }).build({
        name: "First Template",
        defaultPrompt: "Prompt 1",
        createdAt: new Date("2024-01-02"),
      })
      const template2 = chatBotFactory.transient({ project }).build({
        name: "Second Template",
        defaultPrompt: "Prompt 2",
      })
      await chatBotRepository.save([template1, template2])

      // Act
      const result = await service.listChatBots({ userId: user.id, projectId: project.id })

      // Assert
      expect(result).toHaveLength(2)
      const [first, second] = result
      expect(first!.name).toBe("Second Template") // Most recent first
      expect(second!.name).toBe("First Template")
    })
  })

  describe("updateChatBot", () => {
    it("should update a ChatBot when user is owner", async () => {
      const { user, chatBot } = await createOrganizationWithChatBot({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
        chatBotRepository,
      })

      // Act
      const result = await service.updateChatBot({
        required: { userId: user.id, chatBotId: chatBot.id },
        fieldsToUpdate: {
          name: "Updated Template",
          defaultPrompt: "Updated Prompt",
        },
      })

      // Assert
      expect(result.name).toBe("Updated Template")
      expect(result.defaultPrompt).toBe("Updated Prompt")
      expect(result.id).toBe(chatBot.id)

      const updatedTemplate = await chatBotRepository.findOne({ where: { id: chatBot.id } })
      expect(updatedTemplate?.name).toBe("Updated Template")
      expect(updatedTemplate?.defaultPrompt).toBe("Updated Prompt")
    })

    it("should update only name when defaultPrompt is not provided", async () => {
      const { user, chatBot } = await createOrganizationWithChatBot(
        {
          organizationRepository,
          userRepository,
          membershipRepository,
          projectRepository,
          chatBotRepository,
        },
        { chatBot: { defaultPrompt: "Original Prompt" } },
      )

      // Act
      const result = await service.updateChatBot({
        required: { userId: user.id, chatBotId: chatBot.id },
        fieldsToUpdate: { name: "Updated Name" },
      })

      // Assert
      expect(result.name).toBe("Updated Name")
      expect(result.defaultPrompt).toBe("Original Prompt") // Unchanged
    })

    it("should throw ForbiddenException when name is less than 3 characters", async () => {
      const { user, chatBot } = await createOrganizationWithChatBot({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
        chatBotRepository,
      })

      const createWrongfulUpdateChatBot = async () =>
        service.updateChatBot({
          required: { userId: user.id, chatBotId: chatBot.id },
          fieldsToUpdate: { name: "AB" },
        })

      // Act & Assert
      await expect(createWrongfulUpdateChatBot()).rejects.toThrow(ForbiddenException)
      await expect(createWrongfulUpdateChatBot()).rejects.toThrow(
        "ChatBot name must be at least 3 characters long",
      )
    })

    it("should throw ForbiddenException when user is member but not owner or admin", async () => {
      const { user, chatBot } = await createOrganizationWithChatBot(
        {
          organizationRepository,
          userRepository,
          membershipRepository,
          projectRepository,
          chatBotRepository,
        },
        { membership: { role: "member" } },
      )

      const createWrongfulUpdateChatBot = async () =>
        service.updateChatBot({
          required: { userId: user.id, chatBotId: chatBot.id },
          fieldsToUpdate: { name: "Updated" },
        })

      // Act & Assert
      await expect(createWrongfulUpdateChatBot()).rejects.toThrow(ForbiddenException)
      await expect(createWrongfulUpdateChatBot()).rejects.toThrow("User must be an owner or admin")
    })

    it("should throw NotFoundException when chat bot does not exist", async () => {
      const user = userFactory.build()
      await userRepository.save(user)
      const nonExistentTemplateId = "00000000-0000-0000-0000-000000000000"

      const createWrongfulUpdateChatBot = async () =>
        service.updateChatBot({
          required: { userId: user.id, chatBotId: nonExistentTemplateId },
          fieldsToUpdate: { name: "Updated" },
        })

      // Act & Assert
      await expect(createWrongfulUpdateChatBot()).rejects.toThrow(NotFoundException)
      await expect(createWrongfulUpdateChatBot()).rejects.toThrow("ChatBot with id")
    })
  })

  describe("deleteChatBot", () => {
    it("should delete a ChatBot when user is owner", async () => {
      const { user, chatBot } = await createOrganizationWithChatBot({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
        chatBotRepository,
      })

      // Act
      await service.deleteChatBot(user.id, chatBot.id)

      // Assert
      const deletedTemplate = await chatBotRepository.findOne({ where: { id: chatBot.id } })
      expect(deletedTemplate).toBeNull()
    })

    it("should delete a ChatBot when user is admin", async () => {
      const { user, chatBot } = await createOrganizationWithChatBot(
        {
          organizationRepository,
          userRepository,
          membershipRepository,
          projectRepository,
          chatBotRepository,
        },
        { membership: { role: "admin" } },
      )

      // Act
      await service.deleteChatBot(user.id, chatBot.id)

      // Assert
      const deletedTemplate = await chatBotRepository.findOne({ where: { id: chatBot.id } })
      expect(deletedTemplate).toBeNull()
    })

    it("should throw ForbiddenException when user is member", async () => {
      const { user, chatBot } = await createOrganizationWithChatBot(
        {
          organizationRepository,
          userRepository,
          membershipRepository,
          projectRepository,
          chatBotRepository,
        },
        { membership: { role: "member" } },
      )

      // Act & Assert
      await expect(service.deleteChatBot(user.id, chatBot.id)).rejects.toThrow(ForbiddenException)
      await expect(service.deleteChatBot(user.id, chatBot.id)).rejects.toThrow(
        "User must be an owner or admin",
      )

      // Verify template still exists
      const existingTemplate = await chatBotRepository.findOne({ where: { id: chatBot.id } })
      expect(existingTemplate).not.toBeNull()
    })

    it("should throw NotFoundException when chat bot does not exist", async () => {
      // Arrange
      const user = userFactory.build()
      await userRepository.save(user)
      const nonExistentTemplateId = "00000000-0000-0000-0000-000000000000"

      // Act & Assert
      await expect(service.deleteChatBot(user.id, nonExistentTemplateId)).rejects.toThrow(
        NotFoundException,
      )
      await expect(service.deleteChatBot(user.id, nonExistentTemplateId)).rejects.toThrow(
        "ChatBot with id",
      )
    })

    it("should throw ForbiddenException when user is not a member", async () => {
      const { chatBot } = await createOrganizationWithChatBot({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
        chatBotRepository,
      })
      const anotherUser = userFactory.build()
      await userRepository.save(anotherUser)

      const createWrongfulDeleteChatBot = async () =>
        service.deleteChatBot(anotherUser.id, chatBot.id)

      // Act & Assert
      await expect(createWrongfulDeleteChatBot()).rejects.toThrow(ForbiddenException)
      await expect(createWrongfulDeleteChatBot()).rejects.toThrow(
        "User does not have access to organization",
      )

      // Verify template still exists
      const existingTemplate = await chatBotRepository.findOne({ where: { id: chatBot.id } })
      expect(existingTemplate).not.toBeNull()
    })
  })
})
