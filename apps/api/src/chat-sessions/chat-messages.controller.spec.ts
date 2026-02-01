import type { Repository } from "typeorm"
import { ChatBot } from "@/chat-bots/chat-bot.entity"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import { createOrganizationWithChatSession } from "@/organizations/organization.factory"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import type { EndpointRequest } from "@/request.interface"
import { User } from "@/users/user.entity"
import { ChatMessage } from "./chat-message.entity"
import { ChatMessagesController } from "./chat-messages.controller"
import { createChitChatConversation } from "./chat-messages.factory"
import { ChatSession } from "./chat-session.entity"
import { ChatSessionsModule } from "./chat-sessions.module"

describe("ChatMessagesController", () => {
  let controller: ChatMessagesController
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let projectRepository: Repository<Project>
  let chatBotRepository: Repository<ChatBot>
  let chatSessionRepository: Repository<ChatSession>
  let chatMessageRepository: Repository<ChatMessage>

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase(
      [User, Organization, UserMembership, Project, ChatBot, ChatSession, ChatMessage],
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
    controller = setup.module.get<ChatMessagesController>(ChatMessagesController)
    userRepository = setup.getRepository(User)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    projectRepository = setup.getRepository(Project)
    chatBotRepository = setup.getRepository(ChatBot)
    chatSessionRepository = setup.getRepository(ChatSession)
    chatMessageRepository = setup.getRepository(ChatMessage)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("listMessages", () => {
    it("should return messages for a session", async () => {
      const { user, chatSession: session } = await createOrganizationWithChatSession({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
        chatBotRepository,
        chatSessionRepository,
      })

      // add 2 messages (from the assistant and the user) to the session
      await createChitChatConversation(session, { chatMessageRepository })

      const mockRequest = { user: { id: user.id } } as EndpointRequest

      const response = await controller.listMessages(mockRequest, session.id)

      expect(response.data.sessionId).toBe(session.id)
      expect(response.data.messages).toHaveLength(2)
      expect(response.data.messages[0]?.role).toBe("user")
      expect(response.data.messages[0]?.content).toBe("Hello")
      expect(response.data.messages[1]?.role).toBe("assistant")
      expect(response.data.messages[1]?.content).toBe("Hi!")
    })
  })
})
