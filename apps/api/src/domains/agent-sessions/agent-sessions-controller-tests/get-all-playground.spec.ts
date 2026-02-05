import { buildEndpointRequest } from "@/common/test/request.factory"
import { agentSessionFactory } from "@/domains/agent-sessions/agent-session.factory"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { agentSessionsControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionsControllerTestSetup()

describe("getAllPlayground", () => {
  describe("when user is owner", () => {
    it("should return all playground sessions for an agent and user", async () => {
      const { controller, agentSessionRepository, organization, project } = getTestContext()
      const { user, agent } = await createOrganizationWithAgent(getTestContext())
      const mockRequest = buildEndpointRequest(user)

      // Create multiple playground sessions
      const session1 = agentSessionFactory.transient({ organization, project, agent, user }).build({
        type: "playground",
        createdAt: new Date("2026-01-01T10:00:00Z"),
      })

      const session2 = agentSessionFactory.transient({ organization, project, agent, user }).build({
        type: "playground",
        createdAt: new Date("2026-01-02T10:00:00Z"),
      })

      // Create an app-private session (should not be returned)
      const appSession = agentSessionFactory
        .transient({ organization, project, agent, user })
        .build({
          type: "app-private",
          createdAt: new Date("2026-01-03T10:00:00Z"),
        })

      await agentSessionRepository.save([session1, session2, appSession])

      const { data: result } = await controller.getAllPlayground(mockRequest, agent.id)

      expect(result).toHaveLength(2)
      expect(result.every((session) => session.type === "playground")).toBe(true)
      expect(result.every((session) => session.agentId === agent.id)).toBe(true)
      expect(result.every((session) => session.traceUrl)).toBe(true)
    })

    it("should return empty array when no playground sessions exist", async () => {
      const { controller } = getTestContext()
      const { user, agent } = await createOrganizationWithAgent(getTestContext())
      const mockRequest = buildEndpointRequest(user)

      const { data: result } = await controller.getAllPlayground(mockRequest, agent.id)

      expect(result).toEqual([])
    })

    it("should return sessions in descending order by creation date", async () => {
      const { organization, project, controller, agentSessionRepository } = getTestContext()
      const { user, agent } = await createOrganizationWithAgent(getTestContext())
      const mockRequest = buildEndpointRequest(user)

      const oldSession = agentSessionFactory
        .transient({ organization, project, agent, user })
        .build({
          type: "playground",
          createdAt: new Date("2026-01-01T10:00:00Z"),
        })

      const newestSession = agentSessionFactory
        .transient({ organization, project, agent, user })
        .build({
          type: "playground",
          createdAt: new Date("2026-01-30T10:00:00Z"),
        })

      await agentSessionRepository.save([oldSession, newestSession])

      const { data: result } = await controller.getAllPlayground(mockRequest, agent.id)

      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe(newestSession.id)
      expect(result[1]?.id).toBe(oldSession.id)
    })
  })

  describe("when user is member", () => {
    it("fails when user is member", async () => {
      const { organization, project, controller, agentSessionRepository } = getTestContext()
      const { user, agent } = await createOrganizationWithAgent(getTestContext(), {
        membership: { role: "member" },
      })
      const mockRequest = buildEndpointRequest(user)

      // Create multiple playground sessions
      const session1 = agentSessionFactory.transient({ organization, project, agent, user }).build({
        type: "playground",
        createdAt: new Date("2026-01-01T10:00:00Z"),
      })

      const session2 = agentSessionFactory.transient({ organization, project, agent, user }).build({
        type: "playground",
        createdAt: new Date("2026-01-02T10:00:00Z"),
      })

      // Create an app-private session (should not be returned)
      const appSession = agentSessionFactory
        .transient({ organization, project, agent, user })
        .build({
          type: "app-private",
          createdAt: new Date("2026-01-03T10:00:00Z"),
        })

      await agentSessionRepository.save([session1, session2, appSession])

      await expect(controller.getAllPlayground(mockRequest, agent.id)).rejects.toThrow()
    })
  })
})
