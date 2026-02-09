import { userMembershipFactory } from "@/domains/organizations/user-membership.factory"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("createAppPrivateSession", () => {
  it("should create an app-private session", async () => {
    const { service, testAgent, testUser, testOrganization, membershipRepository } =
      getTestContext()

    const membership = userMembershipFactory
      .transient({ user: testUser, organization: testOrganization })
      .member()
      .build()
    await membershipRepository.save(membership)

    const session = await service.createAppPrivateSession({
      agentId: testAgent.id,
      userId: testUser.id,
      organizationId: testOrganization.id,
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
