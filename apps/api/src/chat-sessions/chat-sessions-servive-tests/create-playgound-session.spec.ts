import { chatSessionControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionControllerTestSetup()

describe("createPlaygroundSession", () => {
  it("should create a new playground session", async () => {
    const { service, testChatBot, testUser, testOrganization } = getTestContext()

    const session = await service.createPlaygroundSession(
      testChatBot.id,
      testUser.id,
      testOrganization.id,
    )

    expect(session).toBeDefined()
    expect(session.type).toBe("playground")
    expect(session.chatBotId).toBe(testChatBot.id)
    expect(session.userId).toBe(testUser.id)
    expect(session.organizationId).toBe(testOrganization.id)
    expect(session.messages).toBeUndefined()
    expect(session.expiresAt).toBeNull()
  })
})
