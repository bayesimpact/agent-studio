import { buildEndpointRequest } from "@/common/test/request.factory"
import { agentSessionFactory } from "@/domains/agent-sessions/agent-session.factory"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { agentSessionsControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionsControllerTestSetup()

describe("getAllApp", () => {
  it("should return all app-private sessions for an agent and user", async () => {
    const { controller, agentSessionRepository, organization } = getTestContext()
    const { user, agent } = await createOrganizationWithAgent(getTestContext())
    const mockRequest = buildEndpointRequest(user)

    // Create multiple app-private sessions
    const session1 = agentSessionFactory.transient({ agent, user, organization }).build({
      type: "app-private",
      createdAt: new Date("2026-01-01T10:00:00Z"),
    })

    const session2 = agentSessionFactory.transient({ agent, user, organization }).build({
      type: "app-private",
      createdAt: new Date("2026-01-02T10:00:00Z"),
    })

    // Create a playground session (should not be returned)
    const playgroundSession = agentSessionFactory.transient({ agent, user, organization }).build({
      type: "playground",
      createdAt: new Date("2026-01-03T10:00:00Z"),
    })

    await agentSessionRepository.save([session1, session2, playgroundSession])

    const { data: result } = await controller.getAllApp(mockRequest, agent.id)

    expect(result).toHaveLength(2)
    expect(result.every((session) => session.type === "app-private")).toBe(true)
    expect(result.every((session) => session.agentId === agent.id)).toBe(true)
    expect(result.every((session) => !session.traceUrl)).toBe(true)
  })

  it("should return empty array when no app-private sessions exist", async () => {
    const { controller } = getTestContext()
    const { user, agent } = await createOrganizationWithAgent(getTestContext())
    const mockRequest = buildEndpointRequest(user)

    const { data: result } = await controller.getAllApp(mockRequest, agent.id)

    expect(result).toEqual([])
  })

  it("should return sessions in descending order by creation date", async () => {
    const { controller, agentSessionRepository, organization } = getTestContext()
    const { user, agent } = await createOrganizationWithAgent(getTestContext())
    const mockRequest = buildEndpointRequest(user)

    const oldSession = agentSessionFactory.transient({ agent, user, organization }).build({
      type: "app-private",
      createdAt: new Date("2026-01-01T10:00:00Z"),
    })

    const newestSession = agentSessionFactory.transient({ agent, user, organization }).build({
      type: "app-private",
      createdAt: new Date("2026-01-30T10:00:00Z"),
    })

    await agentSessionRepository.save([oldSession, newestSession])

    const { data: result } = await controller.getAllApp(mockRequest, agent.id)

    expect(result).toHaveLength(2)
    expect(result[0]?.id).toBe(newestSession.id)
    expect(result[1]?.id).toBe(oldSession.id)
  })
})
