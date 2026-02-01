import { ForbiddenException, NotFoundException } from "@nestjs/common/exceptions"
import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { chatSessionControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionControllerTestSetup()

describe("listMessagesForSession", () => {
  it("should return messages when user is a member of the organization", async () => {
    const {
      service,
      testChatBot,
      testUser,
      testOrganization,
      membershipRepository,
      chatSessionRepository,
    } = getTestContext()

    const membership = userMembershipFactory.build({
      userId: testUser.id,
      organizationId: testOrganization.id,
      role: "member",
      user: testUser,
      organization: testOrganization,
    })
    await membershipRepository.save(membership)

    const session = await service.createPlaygroundSession(
      testChatBot.id,
      testUser.id,
      testOrganization.id,
    )

    session.messages = [
      {
        id: "msg-1",
        role: "user",
        content: "Hello",
        createdAt: new Date().toISOString(),
      },
      {
        id: "msg-2",
        role: "assistant",
        content: "Hi!",
        createdAt: new Date().toISOString(),
      },
    ]
    await chatSessionRepository.save(session)

    const messages = await service.listMessagesForSession(session.id, testUser.id)

    expect(messages).toHaveLength(2)
    expect(messages[0]?.id).toBe("msg-1")
    expect(messages[1]?.id).toBe("msg-2")
  })

  it("should throw NotFoundException when session does not exist", async () => {
    const { service, testUser } = getTestContext()

    await expect(
      service.listMessagesForSession("00000000-0000-0000-0000-000000000000", testUser.id),
    ).rejects.toThrow(NotFoundException)
  })

  it("should throw ForbiddenException when user is not a member of the organization", async () => {
    const { service, testChatBot, testUser, testOrganization } = getTestContext()

    const session = await service.createPlaygroundSession(
      testChatBot.id,
      testUser.id,
      testOrganization.id,
    )

    await expect(service.listMessagesForSession(session.id, testUser.id)).rejects.toThrow(
      ForbiddenException,
    )
  })
})
