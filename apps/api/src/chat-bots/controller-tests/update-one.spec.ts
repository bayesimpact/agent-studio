import type { ChatBotsRoutes } from "@caseai-connect/api-contracts"
import { buildEndpointRequest } from "@/common/test/request.factory"
import { createOrganizationWithChatBot } from "@/organizations/organization.factory"
import { chatBotsControllerTestSetup } from "./test-setup"

const getTestContext = chatBotsControllerTestSetup()

describe("ChatBot - updateOne", () => {
  describe("user is owner", () => {
    it("returns success", async () => {
      const { controller, chatBotRepository } = getTestContext()
      const { user, project, chatBot } = await createOrganizationWithChatBot(getTestContext())
      const mockRequest = buildEndpointRequest(user)

      const existingChatBots = await chatBotRepository.find({
        where: { projectId: project.id },
      })
      expect(existingChatBots).toHaveLength(1)
      expect(existingChatBots[0]?.name).toBe(chatBot.name)
      expect(existingChatBots[0]?.defaultPrompt).toBe(chatBot.defaultPrompt)

      const body = {
        payload: {
          name: "Updated ChatBot",
          defaultPrompt: "Updated Prompt",
        },
      } satisfies typeof ChatBotsRoutes.updateOne.request

      const { data: result } = await controller.updateOne(mockRequest, chatBot.id, body)
      expect(result.success).toBeTruthy()

      const chatBots = await chatBotRepository.find({
        where: { projectId: project.id },
      })

      expect(chatBots).toHaveLength(1)
      expect(chatBots[0]?.name).toBe(body.payload.name)
      expect(chatBots[0]?.defaultPrompt).toBe(body.payload.defaultPrompt)
    })
  })

  describe("user is admin", () => {
    it("should update a chat bot", async () => {
      const { controller, chatBotRepository } = getTestContext()
      const { user, project, chatBot } = await createOrganizationWithChatBot(getTestContext(), {
        membership: { role: "admin" },
      })
      const mockRequest = buildEndpointRequest(user)

      const existingChatBots = await chatBotRepository.find({
        where: { projectId: project.id },
      })
      expect(existingChatBots).toHaveLength(1)
      expect(existingChatBots[0]?.name).toBe(chatBot.name)
      expect(existingChatBots[0]?.defaultPrompt).toBe(chatBot.defaultPrompt)

      const body = {
        payload: {
          name: "Admin Updated ChatBot",
        },
      } satisfies typeof ChatBotsRoutes.updateOne.request

      const { data: result } = await controller.updateOne(mockRequest, chatBot.id, body)
      expect(result.success).toBeTruthy()

      const chatBots = await chatBotRepository.find({
        where: { projectId: project.id },
      })
      expect(chatBots).toHaveLength(1)

      expect(chatBots[0]?.name).toBe(body.payload.name)
      expect(chatBots[0]?.defaultPrompt).toBe(chatBot.defaultPrompt) // unchanged
    })
  })

  describe("user is member", () => {
    it("should throw ForbiddenException", async () => {
      const { controller, chatBotRepository } = getTestContext()
      const { user, project, chatBot } = await createOrganizationWithChatBot(getTestContext(), {
        membership: { role: "member" },
      })
      const mockRequest = buildEndpointRequest(user)

      const existingChatBots = await chatBotRepository.find({
        where: { projectId: project.id },
      })
      expect(existingChatBots).toHaveLength(1)
      expect(existingChatBots[0]?.name).toBe(chatBot.name)
      expect(existingChatBots[0]?.defaultPrompt).toBe(chatBot.defaultPrompt)

      const body = {
        payload: {
          name: "Should Not Update",
        },
      } satisfies typeof ChatBotsRoutes.updateOne.request

      await expect(controller.updateOne(mockRequest, chatBot.id, body)).rejects.toThrow(
        "User must be an owner or admin",
      )

      // Verify chat bot unchanged
      const unchangedChatBot = await chatBotRepository.findOne({
        where: { id: chatBot.id },
      })
      expect(unchangedChatBot?.name).toBe(chatBot.name)
    })
  })

  describe("not found", () => {
    it("should throw NotFoundException when chat bot does not exist", async () => {
      const { controller } = getTestContext()
      const { user } = await createOrganizationWithChatBot(getTestContext())
      const mockRequest = buildEndpointRequest(user)
      const nonExistentChatBotId = "00000000-0000-0000-0000-000000000000"

      const body = {
        payload: {
          name: "Updated",
        },
      } satisfies typeof ChatBotsRoutes.updateOne.request

      await expect(controller.updateOne(mockRequest, nonExistentChatBotId, body)).rejects.toThrow(
        "ChatBot with id",
      )
    })
  })
})
