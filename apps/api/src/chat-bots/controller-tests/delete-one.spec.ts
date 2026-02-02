import { buildEndpointRequest } from "@/common/test/request.factory"
import {
  createOrganizationWithChatBot,
  createOrganizationWithChatSession,
} from "@/organizations/organization.factory"
import { chatBotsControllerTestSetup } from "./test-setup"

const getTestContext = chatBotsControllerTestSetup()

describe("ChatBot - deleteOne", () => {
  describe("user is owner", () => {
    it("should delete a chat bot", async () => {
      const { controller, chatBotRepository } = getTestContext()
      const { user, chatBot } = await createOrganizationWithChatBot(getTestContext())
      const mockRequest = buildEndpointRequest(user)

      const { data: result } = await controller.deleteOne(mockRequest, chatBot.id)

      expect(result.success).toBe(true)

      const deletedChatBot = await chatBotRepository.findOne({
        where: { id: chatBot.id },
      })
      expect(deletedChatBot).toBeNull()
    })
  })

  describe("user is admin", () => {
    it("should delete a chat bot", async () => {
      const { controller, chatBotRepository } = getTestContext()
      const { user, chatBot } = await createOrganizationWithChatBot(getTestContext(), {
        membership: { role: "admin" },
      })
      const mockRequest = buildEndpointRequest(user)

      const { data: result } = await controller.deleteOne(mockRequest, chatBot.id)

      expect(result.success).toBe(true)

      const deletedChatBot = await chatBotRepository.findOne({
        where: { id: chatBot.id },
      })
      expect(deletedChatBot).toBeNull()
    })
  })

  describe("user is member", () => {
    it("should throw ForbiddenException", async () => {
      const { controller, chatBotRepository } = getTestContext()
      const { user, chatBot } = await createOrganizationWithChatBot(getTestContext(), {
        membership: { role: "member" },
      })
      const mockRequest = buildEndpointRequest(user)

      await expect(controller.deleteOne(mockRequest, chatBot.id)).rejects.toThrow(
        "User must be an owner or admin",
      )

      const existingChatBot = await chatBotRepository.findOne({
        where: { id: chatBot.id },
      })
      expect(existingChatBot).not.toBeNull()
    })
  })

  describe("chat bot does not exist", () => {
    it("should throw NotFoundException", async () => {
      const { controller } = getTestContext()
      const { user } = await createOrganizationWithChatBot(getTestContext())
      const mockRequest = buildEndpointRequest(user)
      const nonExistentChatBotId = "00000000-0000-0000-0000-000000000000"

      await expect(controller.deleteOne(mockRequest, nonExistentChatBotId)).rejects.toThrow(
        "ChatBot with id",
      )
    })
  })

  describe("when chat bot has sessions", () => {
    it("should delete chat bot and its sessions", async () => {
      const { controller, chatBotRepository, chatSessionRepository } = getTestContext()
      const { user, chatBot, chatSession } = await createOrganizationWithChatSession(
        getTestContext(),
      )
      const mockRequest = buildEndpointRequest(user)

      const { data: result } = await controller.deleteOne(mockRequest, chatBot.id)

      expect(result.success).toBe(true)

      const deletedChatBot = await chatBotRepository.findOne({
        where: { id: chatBot.id },
      })
      expect(deletedChatBot).toBeNull()

      const deletedSession = await chatSessionRepository.findOne({
        where: { id: chatSession.id },
      })
      expect(deletedSession).toBeNull()
    })
  })
})
