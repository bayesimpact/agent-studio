import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { chatSessionControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionControllerTestSetup()

describe("createAppPrivateSession", () => {
  it("should create an app-private session", async () => {
    const { service, testChatBot, testUser, testOrganization, membershipRepository } =
      getTestContext()

    const membership = userMembershipFactory
      .transient({ user: testUser, organization: testOrganization })
      .member()
      .build()
    await membershipRepository.save(membership)

    const session = await service.createAppPrivateSession({
      chatBotId: testChatBot.id,
      userId: testUser.id,
      organizationId: testOrganization.id,
    })

    expect(session).toBeDefined()
    expect(session.type).toBe("app-private")
    expect(session.chatBotId).toBe(testChatBot.id)
    expect(session.userId).toBe(testUser.id)
    expect(session.organizationId).toBe(testOrganization.id)
    expect(session.messages).toBeUndefined()
    expect(session.expiresAt).toBeNull()
  })
})
