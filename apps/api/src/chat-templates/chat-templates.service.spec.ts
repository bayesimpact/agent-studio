import { ForbiddenException, NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { ChatTemplate } from "@/chat-templates/chat-template.entity"
import { chatTemplateFactory } from "@/chat-templates/chat-template.factory"
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
import { userFactory } from "@/users/user.factory"
import { ChatTemplatesModule } from "./chat-templates.module"
import { ChatTemplatesService } from "./chat-templates.service"

describe("ChatTemplatesService", () => {
  let service: ChatTemplatesService
  let chatTemplateRepository: Repository<ChatTemplate>
  let projectRepository: Repository<Project>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let userRepository: Repository<User>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase(
      [ChatTemplate, Project, Organization, UserMembership, User],
      [],
      [ChatTemplatesModule],
    )
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    await setup.startTransaction()
    service = setup.module.get<ChatTemplatesService>(ChatTemplatesService)
    chatTemplateRepository = setup.getRepository(ChatTemplate)
    projectRepository = setup.getRepository(Project)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    userRepository = setup.getRepository(User)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  describe("createChatTemplate", () => {
    it("should create a chat template when user is owner", async () => {
      // Arrange
      const user = userFactory.build({
        email: "owner@example.com",
        auth0Id: "auth0|chat-template-owner-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Test Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "owner",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Test Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      // Act
      const result = await service.createChatTemplate(
        savedUser.id,
        savedProject.id,
        "My Template",
        "This is a default prompt",
      )

      // Assert
      expect(result.name).toBe("My Template")
      expect(result.defaultPrompt).toBe("This is a default prompt")
      expect(result.projectId).toBe(savedProject.id)
      expect(result.id).toBeDefined()

      const savedTemplate = await chatTemplateRepository.findOne({
        where: { id: result.id },
      })
      expect(savedTemplate).not.toBeNull()
      expect(savedTemplate?.name).toBe("My Template")
    })

    it("should create a chat template when user is admin", async () => {
      // Arrange
      const user = userFactory.build({
        email: "admin@example.com",
        auth0Id: "auth0|chat-template-admin-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Admin Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "admin",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Admin Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      // Act
      const result = await service.createChatTemplate(
        savedUser.id,
        savedProject.id,
        "Admin Template",
        "Admin prompt",
      )

      // Assert
      expect(result.name).toBe("Admin Template")
      expect(result.defaultPrompt).toBe("Admin prompt")
    })

    it("should throw ForbiddenException when name is less than 3 characters", async () => {
      // Arrange
      const user = userFactory.build({
        email: "owner@example.com",
        auth0Id: "auth0|owner-short",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Test Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "owner",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Test Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      // Act & Assert
      await expect(
        service.createChatTemplate(savedUser.id, savedProject.id, "AB", "Prompt"),
      ).rejects.toThrow(ForbiddenException)
      await expect(
        service.createChatTemplate(savedUser.id, savedProject.id, "AB", "Prompt"),
      ).rejects.toThrow("Chat template name must be at least 3 characters long")
    })

    it("should throw ForbiddenException when user is not a member", async () => {
      // Arrange
      const user = userFactory.build({
        email: "nonmember@example.com",
        auth0Id: "auth0|chat-template-nonmember-create-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Other Org" })
      const savedOrg = await organizationRepository.save(org)

      const project = projectFactory.build({
        name: "Other Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      // Act & Assert
      await expect(
        service.createChatTemplate(savedUser.id, savedProject.id, "Template", "Prompt"),
      ).rejects.toThrow(ForbiddenException)
      await expect(
        service.createChatTemplate(savedUser.id, savedProject.id, "Template", "Prompt"),
      ).rejects.toThrow("User does not have access to organization")
    })

    it("should throw ForbiddenException when user is member but not owner or admin", async () => {
      // Arrange
      const user = userFactory.build({
        email: "member@example.com",
        auth0Id: "auth0|chat-template-member-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Member Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "member",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Member Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      // Act & Assert
      await expect(
        service.createChatTemplate(savedUser.id, savedProject.id, "Template", "Prompt"),
      ).rejects.toThrow(ForbiddenException)
      await expect(
        service.createChatTemplate(savedUser.id, savedProject.id, "Template", "Prompt"),
      ).rejects.toThrow("User must be an owner or admin")
    })

    it("should throw NotFoundException when project does not exist", async () => {
      // Arrange
      const user = userFactory.build({
        email: "user@example.com",
        auth0Id: "auth0|chat-template-user-1",
      })
      const savedUser = await userRepository.save(user)
      const nonExistentProjectId = "00000000-0000-0000-0000-000000000000"

      // Act & Assert
      await expect(
        service.createChatTemplate(savedUser.id, nonExistentProjectId, "Template", "Prompt"),
      ).rejects.toThrow(NotFoundException)
      await expect(
        service.createChatTemplate(savedUser.id, nonExistentProjectId, "Template", "Prompt"),
      ).rejects.toThrow("Project with id")
    })
  })

  describe("listChatTemplates", () => {
    it("should return chat templates for a project", async () => {
      // Arrange
      const user = userFactory.build({
        email: "list@example.com",
        auth0Id: "auth0|chat-template-list-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "List Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "member",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "List Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template1 = chatTemplateFactory.build({
        name: "Template 1",
        defaultPrompt: "Prompt 1",
        projectId: savedProject.id,
      })
      const template2 = chatTemplateFactory.build({
        name: "Template 2",
        defaultPrompt: "Prompt 2",
        projectId: savedProject.id,
      })
      await chatTemplateRepository.save([template1, template2])

      // Act
      const result = await service.listChatTemplates(savedUser.id, savedProject.id)

      // Assert
      expect(result).toHaveLength(2)
      expect(result.map((t) => t.name)).toContain("Template 1")
      expect(result.map((t) => t.name)).toContain("Template 2")
    })

    it("should return empty array when project has no chat templates", async () => {
      // Arrange
      const user = userFactory.build({
        email: "empty@example.com",
        auth0Id: "auth0|chat-template-empty-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Empty Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "member",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Empty Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      // Act
      const result = await service.listChatTemplates(savedUser.id, savedProject.id)

      // Assert
      expect(result).toEqual([])
    })

    it("should throw ForbiddenException when user is not a member", async () => {
      // Arrange
      const user = userFactory.build({ email: "nonmember@example.com" })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Other Org" })
      const savedOrg = await organizationRepository.save(org)

      const project = projectFactory.build({
        name: "Other Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      // Act & Assert
      await expect(service.listChatTemplates(savedUser.id, savedProject.id)).rejects.toThrow(
        ForbiddenException,
      )
      await expect(service.listChatTemplates(savedUser.id, savedProject.id)).rejects.toThrow(
        "User does not have access to organization",
      )
    })

    it("should return chat templates ordered by createdAt DESC", async () => {
      // Arrange
      const user = userFactory.build({
        email: "ordered@example.com",
        auth0Id: "auth0|chat-template-ordered-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Ordered Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "member",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Ordered Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template1 = chatTemplateFactory.build({
        name: "First Template",
        defaultPrompt: "Prompt 1",
        projectId: savedProject.id,
        createdAt: new Date("2024-01-01"),
      })
      const template2 = chatTemplateFactory.build({
        name: "Second Template",
        defaultPrompt: "Prompt 2",
        projectId: savedProject.id,
        createdAt: new Date("2024-01-02"),
      })
      await chatTemplateRepository.save([template1, template2])

      // Act
      const result = await service.listChatTemplates(savedUser.id, savedProject.id)

      // Assert
      expect(result).toHaveLength(2)
      const [first, second] = result
      expect(first!.name).toBe("Second Template") // Most recent first
      expect(second!.name).toBe("First Template")
    })
  })

  describe("updateChatTemplate", () => {
    it("should update a chat template when user is owner", async () => {
      // Arrange
      const user = userFactory.build({
        email: "owner@example.com",
        auth0Id: "auth0|chat-template-owner-update-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Update Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "owner",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Update Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatTemplateFactory.build({
        name: "Original Template",
        defaultPrompt: "Original Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatTemplateRepository.save(template)

      // Act
      const result = await service.updateChatTemplate(
        savedUser.id,
        savedTemplate.id,
        "Updated Template",
        "Updated Prompt",
      )

      // Assert
      expect(result.name).toBe("Updated Template")
      expect(result.defaultPrompt).toBe("Updated Prompt")
      expect(result.id).toBe(savedTemplate.id)

      const updatedTemplate = await chatTemplateRepository.findOne({
        where: { id: savedTemplate.id },
      })
      expect(updatedTemplate?.name).toBe("Updated Template")
      expect(updatedTemplate?.defaultPrompt).toBe("Updated Prompt")
    })

    it("should update only name when defaultPrompt is not provided", async () => {
      // Arrange
      const user = userFactory.build({
        email: "owner@example.com",
        auth0Id: "auth0|owner-update-partial",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Partial Update Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "owner",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Partial Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatTemplateFactory.build({
        name: "Original Template",
        defaultPrompt: "Original Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatTemplateRepository.save(template)

      // Act
      const result = await service.updateChatTemplate(
        savedUser.id,
        savedTemplate.id,
        "Updated Name",
      )

      // Assert
      expect(result.name).toBe("Updated Name")
      expect(result.defaultPrompt).toBe("Original Prompt") // Unchanged
    })

    it("should throw ForbiddenException when name is less than 3 characters", async () => {
      // Arrange
      const user = userFactory.build({
        email: "owner@example.com",
        auth0Id: "auth0|owner-short-update",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Test Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "owner",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Test Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatTemplateFactory.build({
        name: "Original Template",
        defaultPrompt: "Original Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatTemplateRepository.save(template)

      // Act & Assert
      await expect(
        service.updateChatTemplate(savedUser.id, savedTemplate.id, "AB"),
      ).rejects.toThrow(ForbiddenException)
      await expect(
        service.updateChatTemplate(savedUser.id, savedTemplate.id, "AB"),
      ).rejects.toThrow("Chat template name must be at least 3 characters long")
    })

    it("should throw ForbiddenException when user is member but not owner or admin", async () => {
      // Arrange
      const user = userFactory.build({
        email: "member@example.com",
        auth0Id: "auth0|chat-template-member-update-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Member Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "member",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Member Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatTemplateFactory.build({
        name: "Template",
        defaultPrompt: "Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatTemplateRepository.save(template)

      // Act & Assert
      await expect(
        service.updateChatTemplate(savedUser.id, savedTemplate.id, "Updated"),
      ).rejects.toThrow(ForbiddenException)
      await expect(
        service.updateChatTemplate(savedUser.id, savedTemplate.id, "Updated"),
      ).rejects.toThrow("User must be an owner or admin")
    })

    it("should throw NotFoundException when chat template does not exist", async () => {
      // Arrange
      const user = userFactory.build({
        email: "user@example.com",
        auth0Id: "auth0|chat-template-user-update-1",
      })
      const savedUser = await userRepository.save(user)
      const nonExistentTemplateId = "00000000-0000-0000-0000-000000000000"

      // Act & Assert
      await expect(
        service.updateChatTemplate(savedUser.id, nonExistentTemplateId, "Updated"),
      ).rejects.toThrow(NotFoundException)
      await expect(
        service.updateChatTemplate(savedUser.id, nonExistentTemplateId, "Updated"),
      ).rejects.toThrow("Chat template with id")
    })
  })

  describe("deleteChatTemplate", () => {
    it("should delete a chat template when user is owner", async () => {
      // Arrange
      const user = userFactory.build({
        email: "owner@example.com",
        auth0Id: "auth0|chat-template-owner-delete-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Delete Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "owner",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Delete Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatTemplateFactory.build({
        name: "Template to Delete",
        defaultPrompt: "Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatTemplateRepository.save(template)

      // Act
      await service.deleteChatTemplate(savedUser.id, savedTemplate.id)

      // Assert
      const deletedTemplate = await chatTemplateRepository.findOne({
        where: { id: savedTemplate.id },
      })
      expect(deletedTemplate).toBeNull()
    })

    it("should delete a chat template when user is admin", async () => {
      // Arrange
      const user = userFactory.build({
        email: "admin@example.com",
        auth0Id: "auth0|chat-template-admin-delete-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Admin Delete Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "admin",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Admin Delete Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatTemplateFactory.build({
        name: "Admin Template to Delete",
        defaultPrompt: "Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatTemplateRepository.save(template)

      // Act
      await service.deleteChatTemplate(savedUser.id, savedTemplate.id)

      // Assert
      const deletedTemplate = await chatTemplateRepository.findOne({
        where: { id: savedTemplate.id },
      })
      expect(deletedTemplate).toBeNull()
    })

    it("should throw ForbiddenException when user is member", async () => {
      // Arrange
      const user = userFactory.build({
        email: "member@example.com",
        auth0Id: "auth0|chat-template-member-delete-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Member Delete Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "member",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Member Delete Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatTemplateFactory.build({
        name: "Should Not Delete",
        defaultPrompt: "Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatTemplateRepository.save(template)

      // Act & Assert
      await expect(service.deleteChatTemplate(savedUser.id, savedTemplate.id)).rejects.toThrow(
        ForbiddenException,
      )
      await expect(service.deleteChatTemplate(savedUser.id, savedTemplate.id)).rejects.toThrow(
        "User must be an owner or admin",
      )

      // Verify template still exists
      const existingTemplate = await chatTemplateRepository.findOne({
        where: { id: savedTemplate.id },
      })
      expect(existingTemplate).not.toBeNull()
    })

    it("should throw NotFoundException when chat template does not exist", async () => {
      // Arrange
      const user = userFactory.build({
        email: "user@example.com",
        auth0Id: "auth0|chat-template-user-delete-1",
      })
      const savedUser = await userRepository.save(user)
      const nonExistentTemplateId = "00000000-0000-0000-0000-000000000000"

      // Act & Assert
      await expect(service.deleteChatTemplate(savedUser.id, nonExistentTemplateId)).rejects.toThrow(
        NotFoundException,
      )
      await expect(service.deleteChatTemplate(savedUser.id, nonExistentTemplateId)).rejects.toThrow(
        "Chat template with id",
      )
    })

    it("should throw ForbiddenException when user is not a member", async () => {
      // Arrange
      const user = userFactory.build({
        email: "nonmember@example.com",
        auth0Id: "auth0|chat-template-nonmember-delete-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Other Org" })
      const savedOrg = await organizationRepository.save(org)

      const project = projectFactory.build({
        name: "Other Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatTemplateFactory.build({
        name: "Other Template",
        defaultPrompt: "Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatTemplateRepository.save(template)

      // Act & Assert
      await expect(service.deleteChatTemplate(savedUser.id, savedTemplate.id)).rejects.toThrow(
        ForbiddenException,
      )
      await expect(service.deleteChatTemplate(savedUser.id, savedTemplate.id)).rejects.toThrow(
        "User does not have access to organization",
      )

      // Verify template still exists
      const existingTemplate = await chatTemplateRepository.findOne({
        where: { id: savedTemplate.id },
      })
      expect(existingTemplate).not.toBeNull()
    })
  })
})
