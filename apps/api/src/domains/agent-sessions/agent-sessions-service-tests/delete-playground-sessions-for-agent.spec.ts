import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("deletePlaygroundSessionsForAgent", () => {
  it("should delete all playground sessions for an agent", async () => {
    const { service, testAgent, testOrganization, testUser, testProject } = getTestContext()
    const connectScope: RequiredConnectScope = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    // Create multiple playground sessions
    const session1 = await service.createPlaygroundSession({
      connectScope,
      agentId: testAgent.id,
      userId: testUser.id,
    })
    const session2 = await service.createPlaygroundSession({
      connectScope,
      agentId: testAgent.id,
      userId: testUser.id,
    })

    // Create a production session (should not be deleted)
    const productionSession = await service.createProductionSession({
      connectScope,
      agentId: testAgent.id,
      userId: testUser.id,
    })

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
