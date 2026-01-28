import { ForbiddenException, NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { ChatBot } from "@/chat-bots/chat-bot.entity"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { User } from "@/users/user.entity"
import { ChatSession } from "./chat-session.entity"
import { ChatSessionsModule } from "./chat-sessions.module"
import { ChatSessionsService } from "./chat-sessions.service"

describe("ChatSessionsService", () => {
  let service: ChatSessionsService
  let chatSessionRepository: Repository<ChatSession>
  let chatBotRepository: Repository<ChatBot>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let projectRepository: Repository<Project>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>

  // Test data
  let testUser: User
  let testOrganization: Organization
  let testProject: Project
  let testChatBot: ChatBot

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase(
      [ChatSession, ChatBot, User, Organization, Project, UserMembership],
      [],
      [ChatSessionsModule],
    )
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    await setup.startTransaction()
    service = setup.module.get<ChatSessionsService>(ChatSessionsService)
    chatSessionRepository = setup.getRepository(ChatSession)
    chatBotRepository = setup.getRepository(ChatBot)
    userRepository = setup.getRepository(User)
    organizationRepository = setup.getRepository(Organization)
    projectRepository = setup.getRepository(Project)

    // Use unique identifier to avoid conflicts between tests
    const uniqueId = Date.now().toString()

    // Create test data
    testOrganization = organizationRepository.create({
      name: `Test Organization ${uniqueId}`,
    })
    testOrganization = await organizationRepository.save(testOrganization)

    testUser = userRepository.create({
      auth0Id: `auth0|test-user-${uniqueId}`,
      email: `test-${uniqueId}@example.com`,
      name: "Test User",
    })
    testUser = await userRepository.save(testUser)

    testProject = projectRepository.create({
      name: `Test Project ${uniqueId}`,
      organizationId: testOrganization.id,
    })
    testProject = await projectRepository.save(testProject)

    testChatBot = chatBotRepository.create({
      name: `Test ChatBot ${uniqueId}`,
      defaultPrompt: "You are a helpful assistant",
      model: "gemini-2.5-flash",
      temperature: 0,
      locale: "en",
      projectId: testProject.id,
    })
    testChatBot = await chatBotRepository.save(testChatBot)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  describe("createPlaygroundSession", () => {
    it("should create a new playground session with TTL", async () => {
      const session = await service.createPlaygroundSession(
        testChatBot.id,
        testUser.id,
        testOrganization.id,
      )

      expect(session).toBeDefined()
      expect(session.type).toBe("playground")
      expect(session.chatbotId).toBe(testChatBot.id)
      expect(session.userId).toBe(testUser.id)
      expect(session.organizationId).toBe(testOrganization.id)
      expect(session.messages).toEqual([])
      expect(session.expiresAt).toBeDefined()
      expect(session.expiresAt).not.toBeNull()

      // Check TTL is approximately 24 hours (within 1 minute tolerance)
      const now = new Date()
      const expectedExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const timeDiff = Math.abs(session.expiresAt!.getTime() - expectedExpiry.getTime())
      expect(timeDiff).toBeLessThan(60 * 1000) // Within 1 minute
    })

    it("should reuse existing session if TTL not expired", async () => {
      const session1 = await service.createPlaygroundSession(
        testChatBot.id,
        testUser.id,
        testOrganization.id,
      )

      // Add some messages to the session
      session1.messages = [
        {
          id: "msg-1",
          role: "user",
          content: "Hello",
          createdAt: new Date().toISOString(),
        },
      ]
      await chatSessionRepository.save(session1)

      // Create again - should return the same session
      const session2 = await service.createPlaygroundSession(
        testChatBot.id,
        testUser.id,
        testOrganization.id,
      )

      expect(session1.id).toBe(session2.id)
      expect(session2.messages).toHaveLength(1) // Messages preserved
    })

    it("should reset messages and update TTL if session expired", async () => {
      const session1 = await service.createPlaygroundSession(
        testChatBot.id,
        testUser.id,
        testOrganization.id,
      )

      // Add some messages
      session1.messages = [
        {
          id: "msg-1",
          role: "user",
          content: "Hello",
          createdAt: new Date().toISOString(),
        },
      ]

      // Set TTL to expired (1 hour ago)
      const expiredDate = new Date()
      expiredDate.setHours(expiredDate.getHours() - 1)
      session1.expiresAt = expiredDate
      await chatSessionRepository.save(session1)

      // Create again - should reuse but reset messages and update TTL
      const session2 = await service.createPlaygroundSession(
        testChatBot.id,
        testUser.id,
        testOrganization.id,
      )

      expect(session1.id).toBe(session2.id) // Same session
      expect(session2.messages).toEqual([]) // Messages reset
      expect(session2.expiresAt).not.toBeNull()
      expect(session2.expiresAt!.getTime()).toBeGreaterThan(Date.now()) // TTL updated
    })
  })

  describe("createPlaygroundSessionForChatBot", () => {
    it("should create a playground session when user is a member of the organization", async () => {
      const membershipRepository = setup.getRepository(UserMembership)

      await membershipRepository.save({
        userId: testUser.id,
        organizationId: testOrganization.id,
        role: "member",
      })

      const session = await service.createPlaygroundSessionForChatBot(testChatBot.id, testUser.id)

      expect(session).toBeDefined()
      expect(session.type).toBe("playground")
      expect(session.chatbotId).toBe(testChatBot.id)
      expect(session.userId).toBe(testUser.id)
      expect(session.organizationId).toBe(testOrganization.id)
    })

    it("should throw ForbiddenException when user is not a member of the organization", async () => {
      await expect(
        service.createPlaygroundSessionForChatBot(testChatBot.id, testUser.id),
      ).rejects.toThrow(ForbiddenException)
    })

    it("should throw NotFoundException when chat bot does not exist", async () => {
      const membershipRepository = setup.getRepository(UserMembership)

      await membershipRepository.save({
        userId: testUser.id,
        organizationId: testOrganization.id,
        role: "member",
      })

      const nonExistentChatBotId = "00000000-0000-0000-0000-000000000000"

      await expect(
        service.createPlaygroundSessionForChatBot(nonExistentChatBotId, testUser.id),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe("createProductionSession", () => {
    it("should create a production session without TTL", async () => {
      const session = await service.createProductionSession(
        testChatBot.id,
        testUser.id,
        testOrganization.id,
      )

      expect(session).toBeDefined()
      expect(session.type).toBe("production")
      expect(session.chatbotId).toBe(testChatBot.id)
      expect(session.userId).toBe(testUser.id)
      expect(session.organizationId).toBe(testOrganization.id)
      expect(session.messages).toEqual([])
      expect(session.expiresAt).toBeNull()
    })
  })

  describe("findById", () => {
    it("should find an existing session", async () => {
      const createdSession = await service.createPlaygroundSession(
        testChatBot.id,
        testUser.id,
        testOrganization.id,
      )

      const foundSession = await service.findById(createdSession.id)

      expect(foundSession).toBeDefined()
      expect(foundSession?.id).toBe(createdSession.id)
      expect(foundSession?.type).toBe("playground")
    })

    it("should return null for non-existent session", async () => {
      // Use a valid UUID format for non-existent session
      const nonExistentId = "00000000-0000-0000-0000-000000000000"
      const foundSession = await service.findById(nonExistentId)

      expect(foundSession).toBeNull()
    })

    it("should recover aborted streams on load", async () => {
      // Create a session with an old streaming message
      const session = await service.createPlaygroundSession(
        testChatBot.id,
        testUser.id,
        testOrganization.id,
      )

      // Manually add an old streaming message (simulating a crash)
      const oldDate = new Date()
      oldDate.setMinutes(oldDate.getMinutes() - 10) // 10 minutes ago

      session.messages = [
        {
          id: "msg-1",
          role: "assistant",
          content: "",
          status: "streaming",
          startedAt: oldDate.toISOString(),
        },
      ]
      await chatSessionRepository.save(session)

      // Load the session - should recover the aborted stream
      const loadedSession = await service.findById(session.id)

      expect(loadedSession).toBeDefined()
      const recoveredMessage = loadedSession!.messages.find((msg) => msg.id === "msg-1")
      expect(recoveredMessage).toBeDefined()
      expect(recoveredMessage?.status).toBe("aborted")
    })
  })

  describe("prepareForStreaming", () => {
    it("should persist user message and empty assistant message", async () => {
      const session = await service.createPlaygroundSession(
        testChatBot.id,
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
      // Use a valid UUID format for non-existent session
      const nonExistentId = "00000000-0000-0000-0000-000000000000"
      await expect(service.prepareForStreaming(nonExistentId, "Hello")).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe("finalizeStreaming", () => {
    it("should update assistant message with content and completed status", async () => {
      const session = await service.createPlaygroundSession(
        testChatBot.id,
        testUser.id,
        testOrganization.id,
      )

      const { assistantMessageId } = await service.prepareForStreaming(session.id, "Hello")

      const finalizedSession = await service.finalizeStreaming(
        session.id,
        assistantMessageId,
        "Hello! How can I help you today?",
      )

      const assistantMessage = finalizedSession.messages.find(
        (msg) => msg.id === assistantMessageId,
      )
      expect(assistantMessage).toBeDefined()
      expect(assistantMessage?.content).toBe("Hello! How can I help you today?")
      expect(assistantMessage?.status).toBe("completed")
      expect(assistantMessage?.completedAt).toBeDefined()
    })

    it("should throw NotFoundException for non-existent session", async () => {
      // Use a valid UUID format for non-existent session
      const nonExistentId = "00000000-0000-0000-0000-000000000000"
      await expect(
        service.finalizeStreaming(nonExistentId, "00000000-0000-0000-0000-000000000001", "Content"),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe("markStreamingError", () => {
    it("should mark assistant message as error", async () => {
      const session = await service.createPlaygroundSession(
        testChatBot.id,
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

  describe("deletePlaygroundSessionsForChatBot", () => {
    it("should delete all playground sessions for a chatbot", async () => {
      // Create multiple playground sessions
      const session1 = await service.createPlaygroundSession(
        testChatBot.id,
        testUser.id,
        testOrganization.id,
      )
      const session2 = await service.createPlaygroundSession(
        testChatBot.id,
        testUser.id,
        testOrganization.id,
      )

      // Create a production session (should not be deleted)
      const productionSession = await service.createProductionSession(
        testChatBot.id,
        testUser.id,
        testOrganization.id,
      )

      // Delete playground sessions
      await service.deletePlaygroundSessionsForChatBot(testChatBot.id)

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

  describe("deleteExpiredPlaygroundSessions", () => {
    it("should delete expired playground sessions", async () => {
      // Create a non-expired session first
      const validSession = await service.createPlaygroundSession(
        testChatBot.id,
        testUser.id,
        testOrganization.id,
      )

      // Create another chatbot to avoid session reuse
      const anotherChatBot = chatBotRepository.create({
        name: "Another Test ChatBot",
        defaultPrompt: "You are a helpful assistant",
        model: "gemini-2.5-flash",
        temperature: 0,
        locale: "en",
        projectId: testProject.id,
      })
      await chatBotRepository.save(anotherChatBot)

      // Create an expired session with a different chatbot to avoid reuse
      // Set to 1 hour ago to ensure it's well past the 5-minute safety margin
      const expiredDate = new Date()
      expiredDate.setHours(expiredDate.getHours() - 1)

      const expiredSession = chatSessionRepository.create({
        chatbotId: anotherChatBot.id,
        userId: testUser.id,
        organizationId: testOrganization.id,
        type: "playground",
        messages: [],
        expiresAt: expiredDate,
      })
      await chatSessionRepository.save(expiredSession)

      // Verify the expired session exists before deletion
      const beforeDelete = await chatSessionRepository.findOne({
        where: { id: expiredSession.id },
      })
      expect(beforeDelete).toBeDefined()

      // Delete expired sessions
      const deletedCount = await service.deleteExpiredPlaygroundSessions()

      // Verify expired session is deleted
      const foundExpired = await chatSessionRepository.findOne({
        where: { id: expiredSession.id },
      })
      expect(foundExpired).toBeNull()
      expect(deletedCount).toBeGreaterThanOrEqual(1)

      // Verify valid session still exists
      const foundValid = await service.findById(validSession.id)
      expect(foundValid).toBeDefined()
      expect(foundValid).not.toBeNull()
    })

    it("should not delete sessions within safety margin", async () => {
      // Create a session that expired 3 minutes ago (within 5-minute safety margin)
      const recentlyExpiredDate = new Date()
      recentlyExpiredDate.setMinutes(recentlyExpiredDate.getMinutes() - 3)

      const recentlyExpiredSession = chatSessionRepository.create({
        chatbotId: testChatBot.id,
        userId: testUser.id,
        organizationId: testOrganization.id,
        type: "playground",
        messages: [],
        expiresAt: recentlyExpiredDate,
      })
      await chatSessionRepository.save(recentlyExpiredSession)

      // Delete expired sessions
      await service.deleteExpiredPlaygroundSessions()

      // Verify session is NOT deleted (within safety margin)
      const found = await service.findById(recentlyExpiredSession.id)
      expect(found).toBeDefined()
      expect(found).not.toBeNull()
    })
  })
})
