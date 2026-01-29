import { ChatBotLocale, ChatBotModel } from "@caseai-connect/api-contracts"
import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { projectFactory } from "@/projects/project.factory"
import type { EndpointRequest } from "@/request.interface"
import { userFactory } from "@/users/user.factory"
import type { ChatBotsRoutes } from "../chat-bots.routes"
import { chatBotsControllerTestSetup } from "./test-setup"

const getTestContext = chatBotsControllerTestSetup()

describe("ChatBot - createOne", () => {
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

      const auth0Sub = "auth0|chat-bot-ctrl-owner"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "owner@example.com",
          name: "Owner User",
        },
      } as EndpointRequest

      const user = userFactory.build({
        auth0Id: auth0Sub,
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
        name: "Owner Project",
        organizationId: organization.id,
      })
      const savedProject = await projectRepository.save(project)

      const existingChatBots = await chatBotRepository.find({
        where: { projectId: savedProject.id },
      })

      expect(existingChatBots).toHaveLength(0)

      const body = {
        payload: {
          name: "New Template",
          defaultPrompt: "This is a default prompt",
          model: ChatBotModel.Gemini25Flash,
          temperature: 0,
          locale: ChatBotLocale.EN,
        },
      } satisfies typeof ChatBotsRoutes.createOne.request

      const { data: result } = await controller.createOne(mockRequest, savedProject.id, body)

      expect(result.success).toBeTruthy()

      const chatBots = await chatBotRepository.find({
        where: { projectId: savedProject.id },
      })

      expect(chatBots).toHaveLength(1)
      expect(chatBots[0]?.name).toBe(body.payload.name)
    })
  })

  describe("user is admin", () => {
    it("returns success", async () => {
      const {
        controller,
        userRepository,
        membershipRepository,
        projectRepository,
        chatBotRepository,
        organization,
      } = getTestContext()

      const auth0Sub = "auth0|chat-bot-ctrl-admin"
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
        name: "Admin Project",
        organizationId: organization.id,
      })
      const savedProject = await projectRepository.save(project)

      const existingChatBots = await chatBotRepository.find({
        where: { projectId: savedProject.id },
      })

      expect(existingChatBots).toHaveLength(0)

      const body = {
        payload: {
          name: "Admin Template",
          defaultPrompt: "Admin prompt",
          model: ChatBotModel.Gemini25Flash,
          temperature: 0,
          locale: ChatBotLocale.EN,
        },
      } satisfies typeof ChatBotsRoutes.createOne.request

      const { data: result } = await controller.createOne(mockRequest, savedProject.id, body)
      expect(result.success).toBeTruthy()

      const chatBots = await chatBotRepository.find({
        where: { projectId: savedProject.id },
      })

      expect(chatBots).toHaveLength(1)
      expect(chatBots[0]?.name).toBe("Admin Template")
      expect(chatBots[0]?.defaultPrompt).toBe("Admin prompt")
    })
  })

  describe("user is member", () => {
    it("should throw ForbiddenException", async () => {
      const { controller, userRepository, membershipRepository, projectRepository, organization } =
        getTestContext()

      const auth0Sub = "auth0|chat-bot-ctrl-member"
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
        name: "Member Project",
        organizationId: organization.id,
      })
      const savedProject = await projectRepository.save(project)

      const body = {
        payload: {
          name: "Should Fail",
          defaultPrompt: "Prompt",
          model: ChatBotModel.Gemini25Flash,
          temperature: 0,
          locale: ChatBotLocale.EN,
        },
      } satisfies typeof ChatBotsRoutes.createOne.request

      await expect(controller.createOne(mockRequest, savedProject.id, body)).rejects.toThrow(
        "User must be an owner or admin",
      )
    })
  })
})
