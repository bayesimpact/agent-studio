import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("markStreamingError", () => {
  it("should mark assistant message as error", async () => {
    const { service, testAgent, testOrganization, testUser } = getTestContext()

    const session = await service.createPlaygroundSession(
      testAgent.id,
      testUser.id,
      testOrganization.id,
    )

    const { assistantMessageId } = await service.prepareForStreaming(session.id, "Hello")

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
