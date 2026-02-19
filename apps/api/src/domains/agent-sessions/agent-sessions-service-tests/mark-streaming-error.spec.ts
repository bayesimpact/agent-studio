import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("markStreamingError", () => {
  it("should mark assistant message as error", async () => {
    const { service, testAgent, testOrganization, testUser, testProject } = getTestContext()
    const connectScope: RequiredConnectScope = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    const session = await service.createPlaygroundSession({
      connectScope,
      agentId: testAgent.id,
      userId: testUser.id,
    })

    const { assistantMessageId } = await service.prepareForStreaming({
      connectScope,
      sessionId: session.id,
      userContent: "Hello",
    })

    const errorSession = await service.markStreamingError(
      session.id,
      assistantMessageId,
      "An error occurred",
    )

    const errorMessage = errorSession.messages.find((msg) => msg.id === assistantMessageId)
    expect(errorMessage).toBeDefined()
    expect(errorMessage?.status).toBe("error")
    expect(errorMessage?.content).toBe("An error occurred")
    expect(errorMessage?.completedAt).toBeDefined()
  })
})
