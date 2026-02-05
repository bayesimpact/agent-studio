import { agentFactory } from "@/agents/agent.factory"
import { chatSessionFactory } from "../chat-session.factory"
import { chatSessionControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionControllerTestSetup()

describe("deleteExpiredPlaygroundSessions", () => {
  it("should delete expired playground sessions", async () => {
    const {
      service,
      testChatBot,
      testOrganization,
      testUser,
      testProject,
      chatBotRepository,
      chatSessionRepository,
    } = getTestContext()

    // Create a non-expired session first
    const validSession = await service.createPlaygroundSession(
      testChatBot.id,
      testUser.id,
      testOrganization.id,
    )

    // Create another chatbot to avoid session reuse
    const anotherChatBot = agentFactory.transient({ project: testProject }).build({
      name: "Another Test ChatBot",
      defaultPrompt: "You are a helpful assistant",
    })
    await chatBotRepository.save(anotherChatBot)

    // Create an expired session with a different chatbot to avoid reuse
    // Set to 1 hour ago to ensure it's well past the 5-minute safety margin
    const expiredSession = chatSessionFactory
      .transient({ agent: anotherChatBot, user: testUser, organization: testOrganization })
      .playground()
      .expiredMinutesAgo(60)
      .build()
    await chatSessionRepository.save(expiredSession)

    // Verify the expired session exists before deletion
    const beforeDelete = await chatSessionRepository.findOne({
      where: { id: expiredSession.id },
    })
    expect(beforeDelete).toBeDefined()

    // Delete expired sessions
    const deletedCount = await service.deleteExpiredPlaygroundSessions()

    // Verify expired session is deleted
    const foundExpired = await chatSessionRepository.findOne({
      where: { id: expiredSession.id },
    })
    expect(foundExpired).toBeNull()
    expect(deletedCount).toBeGreaterThanOrEqual(1)

    // Verify valid session still exists
    const foundValid = await service.findById(validSession.id)
    expect(foundValid).toBeDefined()
    expect(foundValid).not.toBeNull()
  })

  it("should not delete sessions within safety margin", async () => {
    const { service, testChatBot, testOrganization, testUser, chatSessionRepository } =
      getTestContext()

    // Create a session that expired 3 minutes ago (within 5-minute safety margin)
    const recentlyExpiredSession = chatSessionFactory
      .transient({ agent: testChatBot, user: testUser, organization: testOrganization })
      .playground()
      .expiredMinutesAgo(3)
      .build()
    await chatSessionRepository.save(recentlyExpiredSession)

    // Delete expired sessions
    await service.deleteExpiredPlaygroundSessions()

    // Verify session is NOT deleted (within safety margin)
    const found = await service.findById(recentlyExpiredSession.id)
    expect(found).toBeDefined()
    expect(found).not.toBeNull()
  })
})
