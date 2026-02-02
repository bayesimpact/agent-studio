import { chatSessionControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionControllerTestSetup()

describe("createProductionSession", () => {
  it("should create a production session without TTL", async () => {
    const { service, testChatBot, testOrganization, testUser } = getTestContext()

    const session = await service.createProductionSession(
      testChatBot.id,
      testUser.id,
      testOrganization.id,
    )

    expect(session).toBeDefined()
    expect(session.type).toBe("production")
    expect(session.chatBotId).toBe(testChatBot.id)
    expect(session.userId).toBe(testUser.id)
    expect(session.organizationId).toBe(testOrganization.id)
    expect(session.messages).toBeUndefined()
    expect(session.expiresAt).toBeNull()
  })
})
