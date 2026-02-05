import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("deletePlaygroundSessionsForAgent", () => {
  it("should delete all playground sessions for an agent", async () => {
    const { service, testAgent, testOrganization, testUser } = getTestContext()

    // Create multiple playground sessions
    const session1 = await service.createPlaygroundSession(
      testAgent.id,
      testUser.id,
      testOrganization.id,
    )
    const session2 = await service.createPlaygroundSession(
      testAgent.id,
      testUser.id,
      testOrganization.id,
    )

    // Create a production session (should not be deleted)
    const productionSession = await service.createProductionSession(
      testAgent.id,
      testUser.id,
      testOrganization.id,
    )

    // Delete playground sessions
    await service.deletePlaygroundSessionsForAgent(testAgent.id)

    // Verify playground sessions are deleted
    const found1 = await service.findById(session1.id)
    const found2 = await service.findById(session2.id)
    expect(found1).toBeNull()
    expect(found2).toBeNull()

    // Verify production session still exists
    const foundProduction = await service.findById(productionSession.id)
    expect(foundProduction).toBeDefined()
    expect(foundProduction?.type).toBe("production")
  })
})
