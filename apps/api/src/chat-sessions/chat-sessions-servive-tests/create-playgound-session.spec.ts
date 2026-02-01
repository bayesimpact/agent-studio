import { chatSessionControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionControllerTestSetup()

describe("createPlaygroundSession", () => {
  it("should create a new playground session with TTL", async () => {
    const { service, testChatBot, testUser, testOrganization } = getTestContext()

    const session = await service.createPlaygroundSession(
      testChatBot.id,
      testUser.id,
      testOrganization.id,
    )

    expect(session).toBeDefined()
    expect(session.type).toBe("playground")
    expect(session.chatbotId).toBe(testChatBot.id)
    expect(session.userId).toBe(testUser.id)
    expect(session.organizationId).toBe(testOrganization.id)
    expect(session.messages).toEqual([])
    expect(session.expiresAt).toBeDefined()
    expect(session.expiresAt).not.toBeNull()

    // Check TTL is approximately 24 hours (within 1 minute tolerance)
    const now = new Date()
    const expectedExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const timeDiff = Math.abs(session.expiresAt!.getTime() - expectedExpiry.getTime())
    expect(timeDiff).toBeLessThan(60 * 1000) // Within 1 minute
  })

  it("should reuse existing session if TTL not expired", async () => {
    const { service, testChatBot, testUser, testOrganization, chatSessionRepository } =
      getTestContext()

    const session1 = await service.createPlaygroundSession(
      testChatBot.id,
      testUser.id,
      testOrganization.id,
    )

    // Add some messages to the session
    session1.messages = [
      {
        id: "msg-1",
        role: "user",
        content: "Hello",
        createdAt: new Date().toISOString(),
      },
    ]
    await chatSessionRepository.save(session1)

    // Create again - should return the same session
    const session2 = await service.createPlaygroundSession(
      testChatBot.id,
      testUser.id,
      testOrganization.id,
    )

    expect(session1.id).toBe(session2.id)
    expect(session2.messages).toHaveLength(1) // Messages preserved
  })

  it("should reset messages and update TTL if session expired", async () => {
    const { service, testChatBot, testUser, testOrganization, chatSessionRepository } =
      getTestContext()

    const session1 = await service.createPlaygroundSession(
      testChatBot.id,
      testUser.id,
      testOrganization.id,
    )

    // Add some messages
    session1.messages = [
      {
        id: "msg-1",
        role: "user",
        content: "Hello",
        createdAt: new Date().toISOString(),
      },
    ]

    // Set TTL to expired (1 hour ago)
    const expiredDate = new Date()
    expiredDate.setHours(expiredDate.getHours() - 1)
    session1.expiresAt = expiredDate
    await chatSessionRepository.save(session1)

    // Create again - should reuse but reset messages and update TTL
    const session2 = await service.createPlaygroundSession(
      testChatBot.id,
      testUser.id,
      testOrganization.id,
    )

    expect(session1.id).toBe(session2.id) // Same session
    expect(session2.messages).toEqual([]) // Messages reset
    expect(session2.expiresAt).not.toBeNull()
    expect(session2.expiresAt!.getTime()).toBeGreaterThan(Date.now()) // TTL updated
  })
})
