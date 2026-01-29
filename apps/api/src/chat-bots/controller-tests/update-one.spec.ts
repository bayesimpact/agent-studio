import type { ChatBotsRoutes } from "@caseai-connect/api-contracts"
import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { projectFactory } from "@/projects/project.factory"
import type { EndpointRequest } from "@/request.interface"
import { userFactory } from "@/users/user.factory"
import { chatBotsControllerTestSetup } from "./test-setup"

const getTestContext = chatBotsControllerTestSetup()

describe("ChatBot - updateOne", () => {
  describe("user is owner", () => {
    it("returns success", async () => {
      const {
        controller,
        userRepository,
        membershipRepository,
        projectRepository,
        chatBotRepository,
        organization,
      } = getTestContext()

      const auth0Sub = "auth0|chat-bot-ctrl-update-owner"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "owner@example.com",
          name: "Owner User",
        },
      } as EndpointRequest

      const user = userFactory.build({
        auth0Id: auth0Sub,
        email: "owner@example.com",
        name: "Owner User",
      })
      const savedUser = await userRepository.save(user)

      const membership = userMembershipFactory.build({
        userId: savedUser.id,
        organizationId: organization.id,
        role: "owner",
        user: savedUser,
        organization,
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Update Project",
        organizationId: organization.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatBotFactory.build({
        name: "Original Template",
        defaultPrompt: "Original Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatBotRepository.save(template)

      const existingChatBots = await chatBotRepository.find({
        where: { projectId: savedProject.id },
      })
      expect(existingChatBots).toHaveLength(1)
      expect(existingChatBots[0]?.name).toBe(template.name)
      expect(existingChatBots[0]?.defaultPrompt).toBe(template.defaultPrompt)

      const body = {
        payload: {
          name: "Updated Template",
          defaultPrompt: "Updated Prompt",
        },
      } satisfies typeof ChatBotsRoutes.updateOne.request

      const { data: result } = await controller.updateOne(mockRequest, savedTemplate.id, body)
      expect(result.success).toBeTruthy()

      const chatBots = await chatBotRepository.find({
        where: { projectId: savedProject.id },
      })

      expect(chatBots).toHaveLength(1)
      expect(chatBots[0]?.name).toBe(body.payload.name)
      expect(chatBots[0]?.defaultPrompt).toBe(body.payload.defaultPrompt)
    })
  })

  describe("user is admin", () => {
    it("should update a chat template", async () => {
      const {
        controller,
        userRepository,
        membershipRepository,
        projectRepository,
        chatBotRepository,
        organization,
      } = getTestContext()

      const auth0Sub = "auth0|chat-bot-ctrl-update-admin"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "admin@example.com",
        },
      } as EndpointRequest

      const user = userFactory.build({
        auth0Id: auth0Sub,
        email: "admin@example.com",
      })
      const savedUser = await userRepository.save(user)

      const membership = userMembershipFactory.build({
        userId: savedUser.id,
        organizationId: organization.id,
        role: "admin",
        user: savedUser,
        organization,
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Admin Update Project",
        organizationId: organization.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatBotFactory.build({
        name: "Original Template",
        defaultPrompt: "Original Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatBotRepository.save(template)

      const existingChatBots = await chatBotRepository.find({
        where: { projectId: savedProject.id },
      })
      expect(existingChatBots).toHaveLength(1)
      expect(existingChatBots[0]?.name).toBe(template.name)
      expect(existingChatBots[0]?.defaultPrompt).toBe(template.defaultPrompt)

      const body = {
        payload: {
          name: "Admin Updated Template",
        },
      } satisfies typeof ChatBotsRoutes.updateOne.request

      const { data: result } = await controller.updateOne(mockRequest, savedTemplate.id, body)
      expect(result.success).toBeTruthy()

      const chatBots = await chatBotRepository.find({
        where: { projectId: savedProject.id },
      })
      expect(chatBots).toHaveLength(1)

      expect(chatBots[0]?.name).toBe(body.payload.name)
      expect(chatBots[0]?.defaultPrompt).toBe(template.defaultPrompt) // unchanged
    })
  })

  describe("user is member", () => {
    it("should throw ForbiddenException", async () => {
      const {
        controller,
        userRepository,
        membershipRepository,
        projectRepository,
        chatBotRepository,
        organization,
      } = getTestContext()

      const auth0Sub = "auth0|chat-bot-ctrl-update-member"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "member@example.com",
        },
      } as EndpointRequest

      const user = userFactory.build({
        auth0Id: auth0Sub,
        email: "member@example.com",
      })
      const savedUser = await userRepository.save(user)

      const membership = userMembershipFactory.build({
        userId: savedUser.id,
        organizationId: organization.id,
        role: "member",
        user: savedUser,
        organization,
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Member Update Project",
        organizationId: organization.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatBotFactory.build({
        name: "Template",
        defaultPrompt: "Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatBotRepository.save(template)

      const existingChatBots = await chatBotRepository.find({
        where: { projectId: savedProject.id },
      })
      expect(existingChatBots).toHaveLength(1)
      expect(existingChatBots[0]?.name).toBe(template.name)
      expect(existingChatBots[0]?.defaultPrompt).toBe(template.defaultPrompt)

      const body = {
        payload: {
          name: "Should Not Update",
        },
      } satisfies typeof ChatBotsRoutes.updateOne.request

      await expect(controller.updateOne(mockRequest, savedTemplate.id, body)).rejects.toThrow(
        "User must be an owner or admin",
      )

      // Verify template unchanged
      const unchangedTemplate = await chatBotRepository.findOne({
        where: { id: savedTemplate.id },
      })
      expect(unchangedTemplate?.name).toBe("Template")
    })
  })

  describe("not found", () => {
    it("should throw NotFoundException when chat template does not exist", async () => {
      const { controller } = getTestContext()

      const auth0Sub = "auth0|chat-bot-ctrl-update-notfound"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "user@example.com",
        },
      } as EndpointRequest
      const nonExistentTemplateId = "00000000-0000-0000-0000-000000000000"

      const body = {
        payload: {
          name: "Updated",
        },
      } satisfies typeof ChatBotsRoutes.updateOne.request

      await expect(controller.updateOne(mockRequest, nonExistentTemplateId, body)).rejects.toThrow(
        "ChatBot with id",
      )
    })
  })
})
