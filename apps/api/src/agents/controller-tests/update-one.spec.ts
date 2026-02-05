import type { AgentsRoutes } from "@caseai-connect/api-contracts"
import { buildEndpointRequest } from "@/common/test/request.factory"
import { createOrganizationWithAgent } from "@/organizations/organization.factory"
import { agentsControllerTestSetup } from "./test-setup"

const getTestContext = agentsControllerTestSetup()

describe("Agent - updateOne", () => {
  describe("user is owner", () => {
    it("returns success", async () => {
      const { controller, agentRepository } = getTestContext()
      const { user, project, agent } = await createOrganizationWithAgent(getTestContext())
      const mockRequest = buildEndpointRequest(user)

      const existingAgents = await agentRepository.find({
        where: { projectId: project.id },
      })
      expect(existingAgents).toHaveLength(1)
      expect(existingAgents[0]?.name).toBe(agent.name)
      expect(existingAgents[0]?.defaultPrompt).toBe(agent.defaultPrompt)

      const body = {
        payload: {
          name: "Updated Agent",
          defaultPrompt: "Updated Prompt",
        },
      } satisfies typeof AgentsRoutes.updateOne.request

      const { data: result } = await controller.updateOne(mockRequest, agent.id, body)
      expect(result.success).toBeTruthy()

      const agents = await agentRepository.find({
        where: { projectId: project.id },
      })

      expect(agents).toHaveLength(1)
      expect(agents[0]?.name).toBe(body.payload.name)
      expect(agents[0]?.defaultPrompt).toBe(body.payload.defaultPrompt)
    })
  })

  describe("user is admin", () => {
    it("should update a agent", async () => {
      const { controller, agentRepository } = getTestContext()
      const { user, project, agent } = await createOrganizationWithAgent(getTestContext(), {
        membership: { role: "admin" },
      })
      const mockRequest = buildEndpointRequest(user)

      const existingAgents = await agentRepository.find({
        where: { projectId: project.id },
      })
      expect(existingAgents).toHaveLength(1)
      expect(existingAgents[0]?.name).toBe(agent.name)
      expect(existingAgents[0]?.defaultPrompt).toBe(agent.defaultPrompt)

      const body = {
        payload: {
          name: "Admin Updated Agent",
        },
      } satisfies typeof AgentsRoutes.updateOne.request

      const { data: result } = await controller.updateOne(mockRequest, agent.id, body)
      expect(result.success).toBeTruthy()

      const agents = await agentRepository.find({
        where: { projectId: project.id },
      })
      expect(agents).toHaveLength(1)

      expect(agents[0]?.name).toBe(body.payload.name)
      expect(agents[0]?.defaultPrompt).toBe(agent.defaultPrompt) // unchanged
    })
  })

  describe("user is member", () => {
    it("should throw ForbiddenException", async () => {
      const { controller, agentRepository } = getTestContext()
      const { user, project, agent } = await createOrganizationWithAgent(getTestContext(), {
        membership: { role: "member" },
      })
      const mockRequest = buildEndpointRequest(user)

      const existingAgents = await agentRepository.find({
        where: { projectId: project.id },
      })
      expect(existingAgents).toHaveLength(1)
      expect(existingAgents[0]?.name).toBe(agent.name)
      expect(existingAgents[0]?.defaultPrompt).toBe(agent.defaultPrompt)

      const body = {
        payload: {
          name: "Should Not Update",
        },
      } satisfies typeof AgentsRoutes.updateOne.request

      await expect(controller.updateOne(mockRequest, agent.id, body)).rejects.toThrow(
        "User must be an owner or admin",
      )

      // Verify agent unchanged
      const unchangedAgent = await agentRepository.findOne({
        where: { id: agent.id },
      })
      expect(unchangedAgent?.name).toBe(agent.name)
    })
  })

  describe("not found", () => {
    it("should throw NotFoundException when agent does not exist", async () => {
      const { controller } = getTestContext()
      const { user } = await createOrganizationWithAgent(getTestContext())
      const mockRequest = buildEndpointRequest(user)
      const nonExistentAgentId = "00000000-0000-0000-0000-000000000000"

      const body = {
        payload: {
          name: "Updated",
        },
      } satisfies typeof AgentsRoutes.updateOne.request

      await expect(controller.updateOne(mockRequest, nonExistentAgentId, body)).rejects.toThrow(
        "Agent with id",
      )
    })
  })
})
