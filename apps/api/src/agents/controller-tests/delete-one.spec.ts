import { buildEndpointRequest } from "@/common/test/request.factory"
import {
  createOrganizationWithAgent,
  createOrganizationWithAgentSession,
} from "@/organizations/organization.factory"
import { agentsControllerTestSetup } from "./test-setup"

const getTestContext = agentsControllerTestSetup()

describe("Agent - deleteOne", () => {
  describe("user is owner", () => {
    it("should delete a agent", async () => {
      const { controller, agentRepository } = getTestContext()
      const { user, agent } = await createOrganizationWithAgent(getTestContext())
      const mockRequest = buildEndpointRequest(user)

      const { data: result } = await controller.deleteOne(mockRequest, agent.id)

      expect(result.success).toBe(true)

      const deletedAgent = await agentRepository.findOne({
        where: { id: agent.id },
      })
      expect(deletedAgent).toBeNull()
    })
  })

  describe("user is admin", () => {
    it("should delete a agent", async () => {
      const { controller, agentRepository } = getTestContext()
      const { user, agent } = await createOrganizationWithAgent(getTestContext(), {
        membership: { role: "admin" },
      })
      const mockRequest = buildEndpointRequest(user)

      const { data: result } = await controller.deleteOne(mockRequest, agent.id)

      expect(result.success).toBe(true)

      const deletedAgent = await agentRepository.findOne({
        where: { id: agent.id },
      })
      expect(deletedAgent).toBeNull()
    })
  })

  describe("user is member", () => {
    it("should throw ForbiddenException", async () => {
      const { controller, agentRepository } = getTestContext()
      const { user, agent } = await createOrganizationWithAgent(getTestContext(), {
        membership: { role: "member" },
      })
      const mockRequest = buildEndpointRequest(user)

      await expect(controller.deleteOne(mockRequest, agent.id)).rejects.toThrow(
        "User must be an owner or admin",
      )

      const existingAgent = await agentRepository.findOne({
        where: { id: agent.id },
      })
      expect(existingAgent).not.toBeNull()
    })
  })

  describe("agent does not exist", () => {
    it("should throw NotFoundException", async () => {
      const { controller } = getTestContext()
      const { user } = await createOrganizationWithAgent(getTestContext())
      const mockRequest = buildEndpointRequest(user)
      const nonExistentAgentId = "00000000-0000-0000-0000-000000000000"

      await expect(controller.deleteOne(mockRequest, nonExistentAgentId)).rejects.toThrow(
        "Agent with id",
      )
    })
  })

  describe("when agent has sessions", () => {
    it("should delete agent and its sessions", async () => {
      const { controller, agentRepository, agentSessionRepository } = getTestContext()
      const { user, agent, agentSession } = await createOrganizationWithAgentSession(
        getTestContext(),
      )
      const mockRequest = buildEndpointRequest(user)

      const { data: result } = await controller.deleteOne(mockRequest, agent.id)

      expect(result.success).toBe(true)

      const deletedAgent = await agentRepository.findOne({
        where: { id: agent.id },
      })
      expect(deletedAgent).toBeNull()

      const deletedSession = await agentSessionRepository.findOne({
        where: { id: agentSession.id },
      })
      expect(deletedSession).toBeNull()
    })
  })
})
