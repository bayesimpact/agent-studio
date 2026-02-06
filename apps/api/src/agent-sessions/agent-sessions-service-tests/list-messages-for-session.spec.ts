import { ForbiddenException, NotFoundException } from "@nestjs/common/exceptions"
import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { createChitChatConversation } from "../chat-messages.factory"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("listMessagesForSession", () => {
  it("should return messages when user is a member of the organization", async () => {
    const {
      service,
      testAgent,
      testUser,
      testOrganization,
      membershipRepository,
      chatMessageRepository,
    } = getTestContext()

    await membershipRepository.save(
      userMembershipFactory
        .transient({ user: testUser, organization: testOrganization })
        .owner()
        .build(),
    )

    const session = await service.createPlaygroundSession(
      testAgent.id,
      testUser.id,
      testOrganization.id,
    )

    await createChitChatConversation(session, { chatMessageRepository })

    const messages = await service.listMessagesForSession(session.id, testUser.id)

    expect(messages).toHaveLength(2)
    expect(messages[0]?.role).toBe("user")
    expect(messages[0]?.content).toBe("Hello")
    expect(messages[1]?.role).toBe("assistant")
    expect(messages[1]?.content).toBe("Hi!")
  })

  it("should throw NotFoundException when session does not exist", async () => {
    const { service, testUser } = getTestContext()

    await expect(
      service.listMessagesForSession("00000000-0000-0000-0000-000000000000", testUser.id),
    ).rejects.toThrow(NotFoundException)
  })

  it("should throw ForbiddenException when user is not a member of the organization", async () => {
    const { service, testAgent, testUser, testOrganization } = getTestContext()

    const session = await service.createPlaygroundSession(
      testAgent.id,
      testUser.id,
      testOrganization.id,
    )

    await expect(service.listMessagesForSession(session.id, testUser.id)).rejects.toThrow(
      ForbiddenException,
    )
  })
})
