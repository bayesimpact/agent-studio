import { ChatBotLocale, ChatBotModel } from "@caseai-connect/api-contracts"
import { buildEndpointRequest } from "@/common/test/request.factory"
import { createOrganizationWithProject } from "@/organizations/organization.factory"
import type { ChatBotsRoutes } from "../chat-bots.routes"
import { chatBotsControllerTestSetup } from "./test-setup"

const getTestContext = chatBotsControllerTestSetup()

describe("ChatBot - createOne", () => {
  describe("user is owner", () => {
    it("returns success", async () => {
      const { controller, chatBotRepository } = getTestContext()
      const { user, project } = await createOrganizationWithProject(getTestContext())
      const mockRequest = buildEndpointRequest(user)

      const existingChatBots = await chatBotRepository.find({
        where: { projectId: project.id },
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

      const { data: result } = await controller.createOne(mockRequest, project.id, body)

      expect(result.name).toBe(body.payload.name)
      expect(result.defaultPrompt).toBe(body.payload.defaultPrompt)
      expect(result.model).toBe(body.payload.model)
      expect(result.temperature.toString()).toBe("0.00")
      expect(result.locale).toBe(body.payload.locale)
    })
  })

  describe("user is admin", () => {
    it("returns success", async () => {
      const { controller, chatBotRepository } = getTestContext()
      const { user, project } = await createOrganizationWithProject(getTestContext(), {
        membership: { role: "admin" },
      })
      const mockRequest = buildEndpointRequest(user)

      const existingChatBots = await chatBotRepository.find({
        where: { projectId: project.id },
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

      const { data: result } = await controller.createOne(mockRequest, project.id, body)
      expect(result.name).toBe(body.payload.name)
      expect(result.defaultPrompt).toBe(body.payload.defaultPrompt)
      expect(result.model).toBe(body.payload.model)
      expect(result.temperature.toString()).toBe("0.00")
      expect(result.locale).toBe(body.payload.locale)
    })
  })

  describe("user is member", () => {
    it("should throw ForbiddenException", async () => {
      const { controller } = getTestContext()
      const { user, project } = await createOrganizationWithProject(getTestContext(), {
        membership: { role: "member" },
      })
      const mockRequest = buildEndpointRequest(user)

      const body = {
        payload: {
          name: "Should Fail",
          defaultPrompt: "Prompt",
          model: ChatBotModel.Gemini25Flash,
          temperature: 0,
          locale: ChatBotLocale.EN,
        },
      } satisfies typeof ChatBotsRoutes.createOne.request

      await expect(controller.createOne(mockRequest, project.id, body)).rejects.toThrow(
        "User must be an owner or admin",
      )
    })
  })
})
