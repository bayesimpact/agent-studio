import type { Repository } from "typeorm"
import { ChatBot } from "@/chat-bots/chat-bot.entity"
import { buildEndpointRequest } from "@/common/test/request.factory"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import { createOrganizationWithChatBot } from "@/organizations/organization.factory"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { User } from "@/users/user.entity"
import { ChatSessionsController } from "./chat-sessions.controller"
import { ChatSessionsModule } from "./chat-sessions.module"

describe("ChatSessionsController", () => {
  let controller: ChatSessionsController
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let projectRepository: Repository<Project>
  let chatBotRepository: Repository<ChatBot>

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      featureEntities: [User, Organization, UserMembership, Project, ChatBot],
      additionalImports: [ChatSessionsModule],
    })
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    await setup.startTransaction()
    controller = setup.module.get<ChatSessionsController>(ChatSessionsController)
    userRepository = setup.getRepository(User)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    projectRepository = setup.getRepository(Project)
    chatBotRepository = setup.getRepository(ChatBot)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("createPlaygroundSession", () => {
    it("should create a playground session when user is a member", async () => {
      const { user, chatBot } = await createOrganizationWithChatBot({
        userRepository,
        organizationRepository,
        membershipRepository,
        projectRepository,
        chatBotRepository,
      })
      const mockRequest = buildEndpointRequest(user)

      const { data: result } = await controller.createPlaygroundSession(mockRequest, chatBot.id)

      expect(result.id).toBeDefined()
      expect(result.chatBotId).toBe(chatBot.id)
      expect(result.type).toBe("playground")
    })
  })
})
