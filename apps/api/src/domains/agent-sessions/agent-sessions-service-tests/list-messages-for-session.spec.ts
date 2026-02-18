import { randomUUID } from "node:crypto"
import { ForbiddenException, NotFoundException } from "@nestjs/common/exceptions"

import type { ConnectRequiredFields } from "@/common/entities/connect-required-fields"
import { userMembershipFactory } from "@/domains/organizations/user-membership.factory"
import { createChitChatConversation } from "../agent-messages.factory"
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
      agentMessageRepository,
      testProject,
    } = getTestContext()
    const connectRequiredFields: ConnectRequiredFields = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    await membershipRepository.save(
      userMembershipFactory
        .transient({ organization: testOrganization, user: testUser })
        .owner()
        .build(),
    )

    const session = await service.createPlaygroundSession({
      connectRequiredFields,
      agentId: testAgent.id,
      userId: testUser.id,
    })

    await createChitChatConversation(testOrganization, testProject, session, {
      agentMessageRepository,
    })

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

  it("should throw ForbiddenException when user does not own the session", async () => {
    const { service, testAgent, testUser, testOrganization, testProject } = getTestContext()
    const connectRequiredFields: ConnectRequiredFields = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    const session = await service.createPlaygroundSession({
      connectRequiredFields,
      agentId: testAgent.id,
      userId: testUser.id,
    })

    await expect(service.listMessagesForSession(session.id, randomUUID())).rejects.toThrow(
      ForbiddenException,
    )
  })
})
