import { AgentLocale, AgentModel } from "@caseai-connect/api-contracts"
import { buildEndpointRequest } from "@/common/test/request.factory"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import type { AgentsRoutes } from "../agents.routes"
import { agentsControllerTestSetup } from "./test-setup"

const getTestContext = agentsControllerTestSetup()

describe("Agent - createOne", () => {
  describe("user is owner", () => {
    it("returns success", async () => {
      const { controller, agentRepository } = getTestContext()
      const { user, project } = await createOrganizationWithProject(getTestContext())
      const mockRequest = buildEndpointRequest(user)

      const existingAgents = await agentRepository.find({
        where: { projectId: project.id },
      })

      expect(existingAgents).toHaveLength(0)

      const body = {
        payload: {
          name: "New Template",
          defaultPrompt: "This is a default prompt",
          model: AgentModel.Gemini25Flash,
          temperature: 0,
          locale: AgentLocale.EN,
        },
      } satisfies typeof AgentsRoutes.createOne.request

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
      const { controller, agentRepository } = getTestContext()
      const { user, project } = await createOrganizationWithProject(getTestContext(), {
        membership: { role: "admin" },
      })
      const mockRequest = buildEndpointRequest(user)

      const existingAgents = await agentRepository.find({
        where: { projectId: project.id },
      })

      expect(existingAgents).toHaveLength(0)

      const body = {
        payload: {
          name: "Admin Template",
          defaultPrompt: "Admin prompt",
          model: AgentModel.Gemini25Flash,
          temperature: 0,
          locale: AgentLocale.EN,
        },
      } satisfies typeof AgentsRoutes.createOne.request

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
          model: AgentModel.Gemini25Flash,
          temperature: 0,
          locale: AgentLocale.EN,
        },
      } satisfies typeof AgentsRoutes.createOne.request

      await expect(controller.createOne(mockRequest, project.id, body)).rejects.toThrow(
        "User must be an owner or admin",
      )
    })
  })
})
