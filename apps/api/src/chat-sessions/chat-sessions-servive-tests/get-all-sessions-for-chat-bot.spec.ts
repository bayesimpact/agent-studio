import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { chatSessionFactory } from "@/chat-sessions/chat-session.factory"
import { userFactory } from "@/users/user.factory"
import { chatSessionControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionControllerTestSetup()

describe("getAllSessionsForChatBot", () => {
  it("should return all sessions for a chatbot and user ordered by createdAt DESC", async () => {
    const { service, testChatBot, testOrganization, testUser, chatSessionRepository } =
      getTestContext()

    const buildChatBot = (date: Date) =>
      chatSessionFactory
        .transient({ chatBot: testChatBot, user: testUser, organization: testOrganization })
        .production()
        .build({ createdAt: date })

    // Create multiple sessions with different timestamps
    const oldSession = buildChatBot(new Date("2026-01-01T10:00:00Z"))
    const middleSession = buildChatBot(new Date("2026-01-15T10:00:00Z"))
    const newestSession = buildChatBot(new Date("2026-01-30T10:00:00Z"))

    await chatSessionRepository.save([oldSession, middleSession, newestSession])

    const sessions = await service.getAllSessionsForChatBot({
      chatbotId: testChatBot.id,
      userId: testUser.id,
    })

    expect(sessions).toHaveLength(3)
    expect(sessions[0]?.id).toBe(newestSession.id)
    expect(sessions[1]?.id).toBe(middleSession.id)
    expect(sessions[2]?.id).toBe(oldSession.id)
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
      chatbotId: testChatBot.id,
      userId: testUser.id,
    })

    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.chatbotId).toBe(testChatBot.id)
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
      chatbotId: testChatBot.id,
      userId: testUser.id,
    })

    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.userId).toBe(testUser.id)
  })

  it("should return empty array when no sessions exist", async () => {
    const { service, testChatBot, testUser } = getTestContext()

    const sessions = await service.getAllSessionsForChatBot({
      chatbotId: testChatBot.id,
      userId: testUser.id,
    })

    expect(sessions).toEqual([])
  })

  it("should return sessions of all types (playground, production, app-private)", async () => {
    const { service, testChatBot, testOrganization, testUser, chatSessionRepository } =
      getTestContext()

    const playgroundSession = chatSessionFactory
      .transient({ chatBot: testChatBot, user: testUser, organization: testOrganization })
      .playground()
      .build({ createdAt: new Date("2026-01-01T10:00:00Z") })

    const productionSession = chatSessionFactory
      .transient({ chatBot: testChatBot, user: testUser, organization: testOrganization })
      .production()
      .build({ createdAt: new Date("2026-01-02T10:00:00Z") })

    const appPrivateSession = chatSessionFactory
      .transient({ chatBot: testChatBot, user: testUser, organization: testOrganization })
      .appPrivate()
      .build({ createdAt: new Date("2026-01-03T10:00:00Z") })

    await chatSessionRepository.save([playgroundSession, productionSession, appPrivateSession])

    const sessions = await service.getAllSessionsForChatBot({
      chatbotId: testChatBot.id,
      userId: testUser.id,
    })

    expect(sessions).toHaveLength(3)
    expect(sessions.map((s) => s.type).sort()).toEqual(["app-private", "playground", "production"])
  })
})
