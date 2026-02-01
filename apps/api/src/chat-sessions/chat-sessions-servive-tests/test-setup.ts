import type { Repository } from "typeorm"
import { ChatBot } from "@/chat-bots/chat-bot.entity"
import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import { organizationFactory } from "@/organizations/organization.factory"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { projectFactory } from "@/projects/project.factory"
import { User } from "@/users/user.entity"
import { userFactory } from "@/users/user.factory"
import { ChatMessage } from "../chat-message.entity"
import { ChatSession } from "../chat-session.entity"
import { ChatSessionsModule } from "../chat-sessions.module"
import { ChatSessionsService } from "../chat-sessions.service"

export function chatSessionControllerTestSetup() {
  let service: ChatSessionsService
  let chatSessionRepository: Repository<ChatSession>
  let chatBotRepository: Repository<ChatBot>
  let chatMessageRepository: Repository<ChatMessage>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let projectRepository: Repository<Project>
  let membershipRepository: Repository<UserMembership>
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
    chatMessageRepository = setup.getRepository(ChatMessage)
    chatBotRepository = setup.getRepository(ChatBot)
    userRepository = setup.getRepository(User)
    organizationRepository = setup.getRepository(Organization)
    projectRepository = setup.getRepository(Project)
    membershipRepository = setup.getRepository(UserMembership)

    // Use unique identifier to avoid conflicts between tests
    const uniqueId = Date.now().toString()

    const organization = organizationFactory.build({
      name: `Org for Membership ${uniqueId}`,
    })
    testOrganization = organizationRepository.create(organization)
    testOrganization = await organizationRepository.save(testOrganization)

    const user = userFactory.build({
      auth0Id: `auth0|test-user-${uniqueId}`,
      email: `test-${uniqueId}@example.com`,
      name: "Test User",
    })
    testUser = userRepository.create(user)
    testUser = await userRepository.save(testUser)

    const project = projectFactory.transient({ organization: testOrganization }).build({
      name: `Test Project ${uniqueId}`,
    })
    testProject = projectRepository.create(project)
    testProject = await projectRepository.save(testProject)

    const chatBot = chatBotFactory.transient({ project: testProject }).build({
      name: `Test ChatBot ${uniqueId}`,
      defaultPrompt: "You are a helpful assistant",
      temperature: 0,
    })
    testChatBot = chatBotRepository.create(chatBot)
    testChatBot = await chatBotRepository.save(testChatBot)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
    await clearTestDatabase(setup.dataSource)
  })

  return () => {
    return {
      chatBotRepository,
      chatSessionRepository,
      chatMessageRepository,
      membershipRepository,
      organizationRepository,
      projectRepository,
      service,
      testChatBot,
      testOrganization,
      testProject,
      testUser,
      userRepository,
    }
  }
}
