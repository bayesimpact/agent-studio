import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("createProductionSession", () => {
  it("should create a production session without TTL", async () => {
    const { service, testAgent, testOrganization, testUser } = getTestContext()

    const session = await service.createProductionSession(
      testAgent.id,
      testUser.id,
      testOrganization.id,
    )

    expect(session).toBeDefined()
    expect(session.type).toBe("production")
    expect(session.agentId).toBe(testAgent.id)
    expect(session.userId).toBe(testUser.id)
    expect(session.organizationId).toBe(testOrganization.id)
    expect(session.messages).toBeUndefined()
    expect(session.expiresAt).toBeNull()
  })
})
