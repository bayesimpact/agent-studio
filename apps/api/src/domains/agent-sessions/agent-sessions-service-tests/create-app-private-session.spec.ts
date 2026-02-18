import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { userMembershipFactory } from "@/domains/organizations/user-membership.factory"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("createAppPrivateSession", () => {
  it("should create an app-private session", async () => {
    const { service, testAgent, testUser, testOrganization, membershipRepository, testProject } =
      getTestContext()
    const connectRequiredFields: RequiredConnectScope = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    const membership = userMembershipFactory
      .transient({ user: testUser, organization: testOrganization })
      .member()
      .build()
    await membershipRepository.save(membership)

    const session = await service.createAppPrivateSession({
      connectRequiredFields,
      agentId: testAgent.id,
      userId: testUser.id,
    })

    expect(session).toBeDefined()
    expect(session.type).toBe("app-private")
    expect(session.agentId).toBe(testAgent.id)
    expect(session.userId).toBe(testUser.id)
    expect(session.organizationId).toBe(testOrganization.id)
    expect(session.messages).toBeUndefined()
    expect(session.expiresAt).toBeNull()
  })
})
