import { agentMessageFactory } from "../agent-messages.factory"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("findById", () => {
  it("should find an existing session", async () => {
    const { service, testAgent, testOrganization, testUser } = getTestContext()
    const createdSession = await service.createPlaygroundSession(
      testAgent.id,
      testUser.id,
      testOrganization.id,
    )

    const foundSession = await service.findById(createdSession.id)

    expect(foundSession).toBeDefined()
    expect(foundSession?.id).toBe(createdSession.id)
    expect(foundSession?.type).toBe("playground")
  })

  it("should return null for non-existent session", async () => {
    const { service } = getTestContext()

    // Use a valid UUID format for non-existent session
    const nonExistentId = "00000000-0000-0000-0000-000000000000"
    const foundSession = await service.findById(nonExistentId)

    expect(foundSession).toBeNull()
  })

  it("should recover aborted streams on load", async () => {
    const { service, testAgent, testOrganization, testUser, agentMessageRepository } =
      getTestContext()

    // Create a session with an old streaming message
    const session = await service.createPlaygroundSession(
      testAgent.id,
      testUser.id,
      testOrganization.id,
    )

    // Manually add an old streaming message (simulating a crash)
    const oldDate = new Date()
    oldDate.setMinutes(oldDate.getMinutes() - 10) // 10 minutes ago

    const oldMessage = agentMessageFactory
      .streaming()
      .sentMinutesAgo(10)
      .assistant()
      .transient({ session: session })
      .build()
    await agentMessageRepository.save(oldMessage)

    // Load the session - should recover the aborted stream
    const loadedSession = await service.findById(session.id)

    expect(loadedSession).toBeDefined()
    const recoveredMessage = await agentMessageRepository.findOne({
      where: { id: oldMessage.id },
    })
    expect(recoveredMessage).toBeDefined()
    expect(recoveredMessage?.status).toBe("aborted")
  })
})
