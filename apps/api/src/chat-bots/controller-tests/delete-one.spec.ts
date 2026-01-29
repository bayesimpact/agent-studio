import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { projectFactory } from "@/projects/project.factory"
import type { EndpointRequest } from "@/request.interface"
import { userFactory } from "@/users/user.factory"
import { chatBotsControllerTestSetup } from "./test-setup"

const getTestContext = chatBotsControllerTestSetup()

describe("ChatBot - deleteOne", () => {
  describe("user is owner", () => {
    it("should delete a chat template", async () => {
      const {
        controller,
        userRepository,
        membershipRepository,
        projectRepository,
        chatBotRepository,
        organization,
      } = getTestContext()

      const auth0Sub = "auth0|chat-bot-ctrl-delete-owner"
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
        name: "Delete Project",
        organizationId: organization.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatBotFactory.build({
        name: "Template to Delete",
        defaultPrompt: "Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatBotRepository.save(template)

      const { data: result } = await controller.deleteOne(mockRequest, savedTemplate.id)

      expect(result.success).toBe(true)

      const deletedTemplate = await chatBotRepository.findOne({
        where: { id: savedTemplate.id },
      })
      expect(deletedTemplate).toBeNull()
    })
  })

  describe("user is admin", () => {
    it("should delete a chat template", async () => {
      const {
        controller,
        userRepository,
        membershipRepository,
        projectRepository,
        chatBotRepository,
        organization,
      } = getTestContext()

      const auth0Sub = "auth0|chat-bot-ctrl-delete-admin"
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
        name: "Admin Delete Project",
        organizationId: organization.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatBotFactory.build({
        name: "Admin Template to Delete",
        defaultPrompt: "Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatBotRepository.save(template)

      const { data: result } = await controller.deleteOne(mockRequest, savedTemplate.id)

      expect(result.success).toBe(true)

      const deletedTemplate = await chatBotRepository.findOne({
        where: { id: savedTemplate.id },
      })
      expect(deletedTemplate).toBeNull()
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

      const auth0Sub = "auth0|chat-bot-ctrl-delete-member"
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
        name: "Member Delete Project",
        organizationId: organization.id,
      })
      const savedProject = await projectRepository.save(project)

      const template = chatBotFactory.build({
        name: "Should Not Delete",
        defaultPrompt: "Prompt",
        projectId: savedProject.id,
      })
      const savedTemplate = await chatBotRepository.save(template)

      await expect(controller.deleteOne(mockRequest, savedTemplate.id)).rejects.toThrow(
        "User must be an owner or admin",
      )

      const existingTemplate = await chatBotRepository.findOne({
        where: { id: savedTemplate.id },
      })
      expect(existingTemplate).not.toBeNull()
    })
  })

  describe("chat bot does not exist", () => {
    it("should throw NotFoundException", async () => {
      const { controller } = getTestContext()
      const auth0Sub = "auth0|chat-bot-ctrl-delete-notfound"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "user@example.com",
        },
      } as EndpointRequest
      const nonExistentTemplateId = "00000000-0000-0000-0000-000000000000"

      await expect(controller.deleteOne(mockRequest, nonExistentTemplateId)).rejects.toThrow(
        "ChatBot with id",
      )
    })
  })
})
