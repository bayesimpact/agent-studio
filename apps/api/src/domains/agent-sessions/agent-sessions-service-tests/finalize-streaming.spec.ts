import { NotFoundException } from "@nestjs/common/exceptions"

import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("finalizeStreaming", () => {
  it("should update assistant message with content and completed status", async () => {
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

    const finalizedSession = await service.finalizeStreaming(
      session.id,
      assistantMessageId,
      "Hello! How can I help you today?",
    )

    const assistantMessage = finalizedSession.messages.find((msg) => msg.id === assistantMessageId)
    expect(assistantMessage).toBeDefined()
    expect(assistantMessage?.content).toBe("Hello! How can I help you today?")
    expect(assistantMessage?.status).toBe("completed")
    expect(assistantMessage?.completedAt).toBeDefined()
  })

  it("should throw NotFoundException for non-existent session", async () => {
    const { service } = getTestContext()

    // Use a valid UUID format for non-existent session
    const nonExistentId = "00000000-0000-0000-0000-000000000000"
    await expect(
      service.finalizeStreaming(nonExistentId, "00000000-0000-0000-0000-000000000001", "Content"),
    ).rejects.toThrow(NotFoundException)
  })
})
