import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("createPlaygroundSession", () => {
  it("should create a new playground session", async () => {
    const { service, testAgent, testUser, testOrganization, testProject } = getTestContext()
    const connectRequiredFields: RequiredConnectScope = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    const session = await service.createPlaygroundSession({
      connectRequiredFields,
      agentId: testAgent.id,
      userId: testUser.id,
    })

    expect(session).toBeDefined()
    expect(session.type).toBe("playground")
    expect(session.agentId).toBe(testAgent.id)
    expect(session.userId).toBe(testUser.id)
    expect(session.organizationId).toBe(testOrganization.id)
    expect(session.messages).toBeUndefined()
    expect(session.expiresAt).toBeNull()
  })
})
