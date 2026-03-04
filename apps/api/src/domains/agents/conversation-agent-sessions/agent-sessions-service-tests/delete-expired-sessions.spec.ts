import { afterAll } from "@jest/globals"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { agentFactory } from "@/domains/agents/agent.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { conversationAgentSessionFactory } from "../conversation-agent-session.factory"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("deleteExpiredPlaygroundSessions", () => {
  afterAll(async () => {
    await sdk.shutdown()
  })
  it("should delete expired playground sessions", async () => {
    const {
      service,
      testAgent,
      testOrganization,
      testUser,
      testProject,
      agentRepository,
      conversationAgentSessionRepository,
    } = getTestContext()
    const connectScope: RequiredConnectScope = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    // Create a non-expired session first
    const validSession = await service.createSession({
      connectScope,
      agentId: testAgent.id,
      userId: testUser.id,
      type: "playground",
    })

    // Create another agent to avoid session reuse
    const anotherAgent = agentFactory
      .transient({ organization: testOrganization, project: testProject })
      .build({
        name: "Another Test Agent",
        defaultPrompt: "You are a helpful assistant",
      })
    await agentRepository.save(anotherAgent)

    // Create an expired session with a different agent to avoid reuse
    // Set to 1 hour ago to ensure it's well past the 5-minute safety margin
    const expiredSession = conversationAgentSessionFactory
      .transient({
        organization: testOrganization,
        project: testProject,
        agent: anotherAgent,
        user: testUser,
      })
      .playground()
      .expiredMinutesAgo(60)
      .build()
    await conversationAgentSessionRepository.save(expiredSession)

    // Verify the expired session exists before deletion
    const beforeDelete = await conversationAgentSessionRepository.findOne({
      where: { id: expiredSession.id },
    })
    expect(beforeDelete).toBeDefined()

    // Delete expired sessions
    const deletedCount = await service.deleteExpiredPlaygroundSessions()

    // Verify expired session is deleted
    const foundExpired = await conversationAgentSessionRepository.findOne({
      where: { id: expiredSession.id },
    })
    expect(foundExpired).toBeNull()
    expect(deletedCount).toBeGreaterThanOrEqual(1)

    // Verify valid session still exists
    const foundValid = await service.findById({ id: validSession.id, connectScope })
    expect(foundValid).toBeDefined()
    expect(foundValid).not.toBeNull()
  })

  it("should not delete sessions within safety margin", async () => {
    const {
      service,
      testAgent,
      testOrganization,
      testUser,
      conversationAgentSessionRepository,
      testProject,
    } = getTestContext()

    const connectScope: RequiredConnectScope = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    // Create a session that expired 3 minutes ago (within 5-minute safety margin)
    const recentlyExpiredSession = conversationAgentSessionFactory
      .transient({
        organization: testOrganization,
        project: testProject,
        agent: testAgent,
        user: testUser,
      })
      .playground()
      .expiredMinutesAgo(3)
      .build()
    await conversationAgentSessionRepository.save(recentlyExpiredSession)

    // Delete expired sessions
    await service.deleteExpiredPlaygroundSessions()

    // Verify session is NOT deleted (within safety margin)
    const found = await service.findById({ id: recentlyExpiredSession.id, connectScope })
    expect(found).toBeDefined()
    expect(found).not.toBeNull()
  })
})
