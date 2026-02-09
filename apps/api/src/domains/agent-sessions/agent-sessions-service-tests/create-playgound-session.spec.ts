import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("createPlaygroundSession", () => {
  it("should create a new playground session", async () => {
    const { service, testAgent, testUser, testOrganization } = getTestContext()

    const session = await service.createPlaygroundSession(
      testAgent.id,
      testUser.id,
      testOrganization.id,
    )

    expect(session).toBeDefined()
    expect(session.type).toBe("playground")
    expect(session.agentId).toBe(testAgent.id)
    expect(session.userId).toBe(testUser.id)
    expect(session.organizationId).toBe(testOrganization.id)
    expect(session.messages).toBeUndefined()
    expect(session.expiresAt).toBeNull()
  })
})
