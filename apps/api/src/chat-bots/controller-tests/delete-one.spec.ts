import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { projectFactory } from "@/projects/project.factory"
import type { EndpointRequest } from "@/request.interface"
import { userFactory } from "@/users/user.factory"
import { chatBotsControllerTestSetup } from "./test-setup"

const getTestContext = chatBotsControllerTestSetup()

describe("ChatBot - deleteOne", () => {
  describe("user is owner", () => {
    it("should delete a chat chatBot", async () => {
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

      const membership = userMembershipFactory
        .owner()
        .transient({ user: savedUser, organization })
        .build()

      await membershipRepository.save(membership)

      const project = projectFactory.transient({ organization }).build({
        name: "Delete Project",
      })
      const savedProject = await projectRepository.save(project)

      const chatBot = chatBotFactory.transient({ project: savedProject }).build({
        name: "ChatBot to Delete",
        defaultPrompt: "Prompt",
      })
      const savedChatBot = await chatBotRepository.save(chatBot)

      const { data: result } = await controller.deleteOne(mockRequest, savedChatBot.id)

      expect(result.success).toBe(true)

      const deletedTemplate = await chatBotRepository.findOne({
        where: { id: savedChatBot.id },
      })
      expect(deletedTemplate).toBeNull()
    })
  })

  describe("user is admin", () => {
    it("should delete a chat chatBot", async () => {
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

      const membership = userMembershipFactory
        .admin()
        .transient({ user: savedUser, organization })
        .build()
      await membershipRepository.save(membership)

      const project = projectFactory.transient({ organization }).build({
        name: "Admin Delete Project",
      })
      const savedProject = await projectRepository.save(project)

      const chatBot = chatBotFactory.transient({ project: savedProject }).build({
        name: "Admin ChatBot to Delete",
        defaultPrompt: "Prompt",
      })
      const savedChatBot = await chatBotRepository.save(chatBot)

      const { data: result } = await controller.deleteOne(mockRequest, savedChatBot.id)

      expect(result.success).toBe(true)

      const deletedTemplate = await chatBotRepository.findOne({
        where: { id: savedChatBot.id },
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

      const membership = userMembershipFactory
        .member()
        .transient({ user: savedUser, organization })
        .build()
      await membershipRepository.save(membership)

      const project = projectFactory.transient({ organization }).build({
        name: "Member Delete Project",
      })
      const savedProject = await projectRepository.save(project)

      const chatBot = chatBotFactory.transient({ project: savedProject }).build({
        name: "Should Not Delete",
        defaultPrompt: "Prompt",
      })
      const savedChatBot = await chatBotRepository.save(chatBot)

      await expect(controller.deleteOne(mockRequest, savedChatBot.id)).rejects.toThrow(
        "User must be an owner or admin",
      )

      const existingTemplate = await chatBotRepository.findOne({
        where: { id: savedChatBot.id },
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

  describe("when chat bot has sessions", () => {
    it("should delete chat bot and its sessions", async () => {
      const {
        controller,
        userRepository,
        membershipRepository,
        projectRepository,
        chatBotRepository,
        chatSessionRepository,
        organization,
      } = getTestContext()

      const auth0Sub = "auth0|chat-bot-ctrl-delete-sessions"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "owner-sessions@example.com",
        },
      } as EndpointRequest

      const user = userFactory.build({
        auth0Id: auth0Sub,
        email: "owner-sessions@example.com",
      })
      const savedUser = await userRepository.save(user)

      const membership = userMembershipFactory
        .owner()
        .transient({ user: savedUser, organization })
        .build()
      await membershipRepository.save(membership)

      const project = projectFactory.transient({ organization }).build({
        name: "Delete Project With Sessions",
      })
      const savedProject = await projectRepository.save(project)

      const chatBot = chatBotFactory.transient({ project: savedProject }).build({
        name: "ChatBot with Sessions",
        defaultPrompt: "Prompt",
      })
      const savedChatBot = await chatBotRepository.save(chatBot)

      // Create a session
      const session = chatSessionRepository.create({
        chatBotId: savedChatBot.id,
        userId: savedUser.id,
        organizationId: organization.id,
        type: "production",
      })
      await chatSessionRepository.save(session)

      const { data: result } = await controller.deleteOne(mockRequest, savedChatBot.id)

      expect(result.success).toBe(true)

      const deletedChatBot = await chatBotRepository.findOne({
        where: { id: savedChatBot.id },
      })
      expect(deletedChatBot).toBeNull()

      const deletedSession = await chatSessionRepository.findOne({
        where: { id: session.id },
      })
      expect(deletedSession).toBeNull()
    })
  })
})
