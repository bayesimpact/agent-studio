import { afterAll } from "@jest/globals"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { sdk } from "@/external/llm/open-telemetry-init"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("deletePlaygroundSessionsForAgent", () => {
  afterAll(async () => {
    await sdk.shutdown()
  })
  it("should delete all playground sessions for an agent", async () => {
    const { service, testAgent, testOrganization, testUser, testProject } = getTestContext()
    const connectScope: RequiredConnectScope = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    // Create multiple playground sessions
    const session1 = await service.createSession({
      connectScope,
      agentId: testAgent.id,
      userId: testUser.id,
      type: "playground",
    })
    const session2 = await service.createSession({
      connectScope,
      agentId: testAgent.id,
      userId: testUser.id,
      type: "playground",
    })

    // Delete playground sessions
    await service.deletePlaygroundSessionsForAgent(testAgent.id)

    // Verify playground sessions are deleted
    const found1 = await service.findById(session1.id)
    const found2 = await service.findById(session2.id)
    expect(found1).toBeNull()
    expect(found2).toBeNull()
  })
})
