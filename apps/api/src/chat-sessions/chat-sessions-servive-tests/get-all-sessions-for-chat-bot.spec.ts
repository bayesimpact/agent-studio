import type { ChatSessionTypeDto } from "@caseai-connect/api-contracts"
import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { chatSessionFactory } from "@/chat-sessions/chat-session.factory"
import { userFactory } from "@/users/user.factory"
import { chatSessionControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionControllerTestSetup()

describe("getAllSessionsForChatBot", () => {
  describe("type: app-private", () => {
    it("should return all sessions for a chatbot and user ordered by createdAt DESC", async () => {
      const { service, testChatBot, testOrganization, testUser, chatSessionRepository } =
        getTestContext()

      const buildChatBot = (params: { date: Date; type: ChatSessionTypeDto }) =>
        chatSessionFactory
          .transient({ chatBot: testChatBot, user: testUser, organization: testOrganization })
          .production()
          .build(params)

      // Create multiple sessions with different timestamps
      const prodSession = buildChatBot({
        date: new Date("2026-01-01T10:00:00Z"),
        type: "production",
      })
      const appSession = buildChatBot({
        date: new Date("2026-01-15T10:00:00Z"),
        type: "app-private",
      })
      const playgroundSession = buildChatBot({
        date: new Date("2026-01-30T10:00:00Z"),
        type: "playground",
      })

      await chatSessionRepository.save([prodSession, appSession, playgroundSession])

      const sessions = await service.getAllSessionsForChatBot({
        chatBotId: testChatBot.id,
        userId: testUser.id,
        type: "app-private",
      })

      expect(sessions).toHaveLength(1)
      expect(sessions[0]?.id).toBe(appSession.id)
    })
  })

  describe("type: playground", () => {
    it("should return all sessions for a chatbot and user ordered by createdAt DESC", async () => {
      const { service, testChatBot, testOrganization, testUser, chatSessionRepository } =
        getTestContext()

      const buildChatBot = (params: { date: Date; type: ChatSessionTypeDto }) =>
        chatSessionFactory
          .transient({ chatBot: testChatBot, user: testUser, organization: testOrganization })
          .production()
          .build(params)

      // Create multiple sessions with different timestamps
      const prodSession = buildChatBot({
        date: new Date("2026-01-01T10:00:00Z"),
        type: "production",
      })
      const appSession = buildChatBot({
        date: new Date("2026-01-15T10:00:00Z"),
        type: "app-private",
      })
      const playgroundSession = buildChatBot({
        date: new Date("2026-01-30T10:00:00Z"),
        type: "playground",
      })

      await chatSessionRepository.save([prodSession, appSession, playgroundSession])

      const sessions = await service.getAllSessionsForChatBot({
        chatBotId: testChatBot.id,
        userId: testUser.id,
        type: "playground",
      })

      expect(sessions).toHaveLength(1)
      expect(sessions[0]?.id).toBe(playgroundSession.id)
    })
  })

  it("should return only sessions for the specific chatbot", async () => {
    const {
      service,
      testChatBot,
      testUser,
      chatBotRepository,
      chatSessionRepository,
      testProject,
      testOrganization,
    } = getTestContext()

    // Create another chatbot
    const anotherChatBot = chatBotFactory.transient({ project: testProject }).build({
      name: "Another ChatBot",
    })
    await chatBotRepository.save(anotherChatBot)

    // Create sessions for both chatbots
    const session1 = chatSessionFactory
      .transient({ chatBot: testChatBot, user: testUser, organization: testOrganization })
      .production()
      .build()

    const session2 = chatSessionFactory
      .transient({ chatBot: anotherChatBot, user: testUser, organization: testOrganization })
      .build()

    await chatSessionRepository.save([session1, session2])

    const sessions = await service.getAllSessionsForChatBot({
      chatBotId: testChatBot.id,
      userId: testUser.id,
      type: "production",
    })

    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.chatBotId).toBe(testChatBot.id)
  })

  it("should return only sessions for the specific user", async () => {
    const {
      service,
      testChatBot,
      testOrganization,
      testUser,
      userRepository,
      chatSessionRepository,
    } = getTestContext()

    // Create another user
    const anotherUser = userFactory.build({
      email: "another@example.com",
    })
    await userRepository.save(anotherUser)

    // Create sessions for both users
    const session1 = chatSessionFactory
      .transient({ chatBot: testChatBot, user: testUser, organization: testOrganization })
      .production()
      .build()

    const session2 = chatSessionFactory
      .transient({ chatBot: testChatBot, user: anotherUser, organization: testOrganization })
      .production()
      .build()

    await chatSessionRepository.save([session1, session2])

    const sessions = await service.getAllSessionsForChatBot({
      chatBotId: testChatBot.id,
      userId: testUser.id,
      type: "production",
    })

    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.userId).toBe(testUser.id)
  })

  it("should return empty array when no sessions exist", async () => {
    const { service, testChatBot, testUser } = getTestContext()

    const sessions = await service.getAllSessionsForChatBot({
      chatBotId: testChatBot.id,
      userId: testUser.id,
      type: "production",
    })

    expect(sessions).toEqual([])
  })
})
