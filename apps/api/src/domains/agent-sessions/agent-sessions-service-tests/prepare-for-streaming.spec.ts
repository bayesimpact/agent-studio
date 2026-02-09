import { NotFoundException } from "@nestjs/common/exceptions"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("prepareForStreaming", () => {
  it("should persist user message and empty assistant message", async () => {
    const { service, testAgent, testOrganization, testUser } = getTestContext()

    const session = await service.createPlaygroundSession(
      testAgent.id,
      testUser.id,
      testOrganization.id,
    )

    const { session: updatedSession, assistantMessageId } = await service.prepareForStreaming(
      session.id,
      "Hello, how are you?",
    )

    expect(updatedSession.messages).toHaveLength(2)
    const userMessage = updatedSession.messages[0]!
    const assistantMessage = updatedSession.messages[1]!
    expect(userMessage).toBeDefined()
    expect(assistantMessage).toBeDefined()
    expect(userMessage.role).toBe("user")
    expect(userMessage.content).toBe("Hello, how are you?")
    expect(assistantMessage.role).toBe("assistant")
    expect(assistantMessage.status).toBe("streaming")
    expect(assistantMessage.content).toBe("")
    expect(assistantMessage.id).toBe(assistantMessageId)
    expect(assistantMessage.startedAt).toBeDefined()
  })

  it("should throw NotFoundException for non-existent session", async () => {
    const { service } = getTestContext()

    // Use a valid UUID format for non-existent session
    const nonExistentId = "00000000-0000-0000-0000-000000000000"
    await expect(service.prepareForStreaming(nonExistentId, "Hello")).rejects.toThrow(
      NotFoundException,
    )
  })
})
