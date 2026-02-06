import type { AgentSessionTypeDto } from "@caseai-connect/api-contracts"
import { agentSessionFactory } from "@/agent-sessions/agent-session.factory"
import { agentFactory } from "@/agents/agent.factory"
import { userFactory } from "@/users/user.factory"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("getAllSessionsForAgent", () => {
  describe("type: app-private", () => {
    it("should return all sessions for a agent and user ordered by createdAt DESC", async () => {
      const { service, testAgent, testOrganization, testUser, agentSessionRepository } =
        getTestContext()

      const buildAgent = (params: { date: Date; type: AgentSessionTypeDto }) =>
        agentSessionFactory
          .transient({ agent: testAgent, user: testUser, organization: testOrganization })
          .production()
          .build(params)

      // Create multiple sessions with different timestamps
      const prodSession = buildAgent({
        date: new Date("2026-01-01T10:00:00Z"),
        type: "production",
      })
      const appSession = buildAgent({
        date: new Date("2026-01-15T10:00:00Z"),
        type: "app-private",
      })
      const playgroundSession = buildAgent({
        date: new Date("2026-01-30T10:00:00Z"),
        type: "playground",
      })

      await agentSessionRepository.save([prodSession, appSession, playgroundSession])

      const sessions = await service.getAllSessionsForAgent({
        agentId: testAgent.id,
        userId: testUser.id,
        type: "app-private",
      })

      expect(sessions).toHaveLength(1)
      expect(sessions[0]?.id).toBe(appSession.id)
    })
  })

  describe("type: playground", () => {
    it("should return all sessions for a agent and user ordered by createdAt DESC", async () => {
      const { service, testAgent, testOrganization, testUser, agentSessionRepository } =
        getTestContext()

      const buildAgent = (params: { date: Date; type: AgentSessionTypeDto }) =>
        agentSessionFactory
          .transient({ agent: testAgent, user: testUser, organization: testOrganization })
          .production()
          .build(params)

      // Create multiple sessions with different timestamps
      const prodSession = buildAgent({
        date: new Date("2026-01-01T10:00:00Z"),
        type: "production",
      })
      const appSession = buildAgent({
        date: new Date("2026-01-15T10:00:00Z"),
        type: "app-private",
      })
      const playgroundSession = buildAgent({
        date: new Date("2026-01-30T10:00:00Z"),
        type: "playground",
      })

      await agentSessionRepository.save([prodSession, appSession, playgroundSession])

      const sessions = await service.getAllSessionsForAgent({
        agentId: testAgent.id,
        userId: testUser.id,
        type: "playground",
      })

      expect(sessions).toHaveLength(1)
      expect(sessions[0]?.id).toBe(playgroundSession.id)
    })
  })

  it("should return only sessions for the specific agent", async () => {
    const {
      service,
      testAgent,
      testUser,
      agentRepository,
      agentSessionRepository,
      testProject,
      testOrganization,
    } = getTestContext()

    // Create another agent
    const anotherAgent = agentFactory.transient({ project: testProject }).build({
      name: "Another Agent",
    })
    await agentRepository.save(anotherAgent)

    // Create sessions for both agents
    const session1 = agentSessionFactory
      .transient({ agent: testAgent, user: testUser, organization: testOrganization })
      .production()
      .build()

    const session2 = agentSessionFactory
      .transient({ agent: anotherAgent, user: testUser, organization: testOrganization })
      .build()

    await agentSessionRepository.save([session1, session2])

    const sessions = await service.getAllSessionsForAgent({
      agentId: testAgent.id,
      userId: testUser.id,
      type: "production",
    })

    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.agentId).toBe(testAgent.id)
  })

  it("should return only sessions for the specific user", async () => {
    const {
      service,
      testAgent,
      testOrganization,
      testUser,
      userRepository,
      agentSessionRepository,
    } = getTestContext()

    // Create another user
    const anotherUser = userFactory.build({
      email: "another@example.com",
    })
    await userRepository.save(anotherUser)

    // Create sessions for both users
    const session1 = agentSessionFactory
      .transient({ agent: testAgent, user: testUser, organization: testOrganization })
      .production()
      .build()

    const session2 = agentSessionFactory
      .transient({ agent: testAgent, user: anotherUser, organization: testOrganization })
      .production()
      .build()

    await agentSessionRepository.save([session1, session2])

    const sessions = await service.getAllSessionsForAgent({
      agentId: testAgent.id,
      userId: testUser.id,
      type: "production",
    })

    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.userId).toBe(testUser.id)
  })

  it("should return empty array when no sessions exist", async () => {
    const { service, testAgent, testUser } = getTestContext()

    const sessions = await service.getAllSessionsForAgent({
      agentId: testAgent.id,
      userId: testUser.id,
      type: "production",
    })

    expect(sessions).toEqual([])
  })
})
