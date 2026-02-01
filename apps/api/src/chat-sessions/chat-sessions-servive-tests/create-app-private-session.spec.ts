import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { chatSessionControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionControllerTestSetup()

describe("createAppPrivateSession", () => {
  it("should create an app-private session without TTL", async () => {
    const { service, testChatBot, testUser, testOrganization, membershipRepository } =
      getTestContext()

    const membership = userMembershipFactory.build({
      userId: testUser.id,
      organizationId: testOrganization.id,
      role: "member",
      user: testUser,
      organization: testOrganization,
    })
    await membershipRepository.save(membership)

    const session = await service.createAppPrivateSession({
      chatbotId: testChatBot.id,
      userId: testUser.id,
    })

    expect(session).toBeDefined()
    expect(session.type).toBe("app-private")
    expect(session.chatbotId).toBe(testChatBot.id)
    expect(session.userId).toBe(testUser.id)
    expect(session.organizationId).toBe(testOrganization.id)
    expect(session.messages).toEqual([])
    expect(session.expiresAt).toBeNull()
  })
})
