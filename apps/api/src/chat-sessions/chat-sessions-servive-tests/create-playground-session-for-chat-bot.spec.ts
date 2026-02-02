import { ForbiddenException, NotFoundException } from "@nestjs/common/exceptions"
import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { chatSessionControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionControllerTestSetup()

describe("createPlaygroundSessionForChatBot", () => {
  it("should create a playground session when user is a member of the organization", async () => {
    const { service, testChatBot, testUser, testOrganization, membershipRepository } =
      getTestContext()

    const membership = userMembershipFactory
      .transient({ user: testUser, organization: testOrganization })
      .owner()
      .build()
    await membershipRepository.save(membership)

    const session = await service.createPlaygroundSessionForChatBot(testChatBot.id, testUser.id)

    expect(session).toBeDefined()
    expect(session.type).toBe("playground")
    expect(session.chatBotId).toBe(testChatBot.id)
    expect(session.userId).toBe(testUser.id)
    expect(session.organizationId).toBe(testOrganization.id)
  })

  it("should throw ForbiddenException when user is not a member of the organization", async () => {
    const { service, testChatBot, testUser } = getTestContext()

    await expect(
      service.createPlaygroundSessionForChatBot(testChatBot.id, testUser.id),
    ).rejects.toThrow(ForbiddenException)
  })

  it("should throw NotFoundException when chat bot does not exist", async () => {
    const { service, testUser, testOrganization, membershipRepository } = getTestContext()

    const membership = userMembershipFactory
      .transient({ user: testUser, organization: testOrganization })
      .owner()
      .build()
    await membershipRepository.save(membership)

    const nonExistentChatBotId = "00000000-0000-0000-0000-000000000000"

    await expect(
      service.createPlaygroundSessionForChatBot(nonExistentChatBotId, testUser.id),
    ).rejects.toThrow(NotFoundException)
  })
})
