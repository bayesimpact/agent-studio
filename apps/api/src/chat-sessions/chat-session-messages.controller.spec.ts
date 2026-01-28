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
import type { EndpointRequest } from "@/request.interface"
import { User } from "@/users/user.entity"
import { ChatSession } from "./chat-session.entity"
import { ChatSessionMessagesController } from "./chat-session-messages.controller"
import { ChatSessionsModule } from "./chat-sessions.module"

describe("ChatSessionMessagesController", () => {
  let controller: ChatSessionMessagesController
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let projectRepository: Repository<Project>
  let chatBotRepository: Repository<ChatBot>
  let chatSessionRepository: Repository<ChatSession>

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase(
      [User, Organization, UserMembership, Project, ChatBot, ChatSession],
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
    controller = setup.module.get<ChatSessionMessagesController>(ChatSessionMessagesController)
    userRepository = setup.getRepository(User)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    projectRepository = setup.getRepository(Project)
    chatBotRepository = setup.getRepository(ChatBot)
    chatSessionRepository = setup.getRepository(ChatSession)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("listMessages", () => {
    it("should return messages for a session", async () => {
      const auth0Sub = "auth0|chat-session-messages"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "member@example.com",
        },
      } as EndpointRequest

      const organization = organizationRepository.create({ name: "Messages Org" })
      const savedOrganization = await organizationRepository.save(organization)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "member@example.com",
      })

      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrganization.id,
        role: "member",
      })

      const project = projectRepository.create({
        name: "Messages Project",
        organizationId: savedOrganization.id,
      })
      const savedProject = await projectRepository.save(project)

      const chatBot = chatBotRepository.create({
        name: "Messages Bot",
        defaultPrompt: "You are a helpful assistant",
        model: "gemini-2.5-flash",
        temperature: 0,
        locale: "en",
        projectId: savedProject.id,
      })
      const savedChatBot = await chatBotRepository.save(chatBot)

      const session = chatSessionRepository.create({
        chatbotId: savedChatBot.id,
        userId: user.id,
        organizationId: savedOrganization.id,
        type: "playground",
        messages: [
          {
            id: "msg-1",
            role: "user",
            content: "Hello",
            createdAt: new Date().toISOString(),
          },
          {
            id: "msg-2",
            role: "assistant",
            content: "Hi!",
            createdAt: new Date().toISOString(),
          },
        ],
        expiresAt: null,
      })
      const savedSession = await chatSessionRepository.save(session)

      mockRequest.user.id = user.id

      const response = await controller.listMessages(mockRequest, savedSession.id)

      expect(response.data.sessionId).toBe(savedSession.id)
      expect(response.data.messages).toHaveLength(2)
      expect(response.data.messages[0]?.id).toBe("msg-1")
      expect(response.data.messages[1]?.id).toBe("msg-2")
    })
  })
})

