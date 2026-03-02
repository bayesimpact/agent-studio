import { afterAll } from "@jest/globals"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { userMembershipFactory } from "@/domains/organizations/user-membership.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { createChitChatConversation } from "../messages/agent-messages.factory"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("listMessagesForSession", () => {
  afterAll(async () => {
    await sdk.shutdown()
  })
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
    const connectScope: RequiredConnectScope = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    await membershipRepository.save(
      userMembershipFactory
        .transient({ organization: testOrganization, user: testUser })
        .owner()
        .build(),
    )

    const session = await service.createSession({
      connectScope,
      agentId: testAgent.id,
      userId: testUser.id,
      type: "playground",
    })

    await createChitChatConversation(testOrganization, testProject, session, {
      agentMessageRepository,
    })

    const messages = await service.listMessagesForSession(session.id)

    expect(messages).toHaveLength(2)
    expect(messages[0]?.role).toBe("user")
    expect(messages[0]?.content).toBe("Hello")
    expect(messages[1]?.role).toBe("assistant")
    expect(messages[1]?.content).toBe("Hi!")
  })
})
