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
import type { EndpointRequest } from "@/request.interface"
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
    setup = await setupTransactionalTestDatabase(
      [User, Organization, UserMembership, Project, ChatBot],
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
      const auth0Sub = "auth0|chat-session-ctrl-member"
      const organization = organizationFactory.build({ name: "Playground Org" })
      const savedOrganization = await organizationRepository.save(organization)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "member@example.com",
      })

      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "member@example.com",
          id: user.id,
        },
      } as EndpointRequest

      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrganization.id,
        role: "owner",
      })

      const project = projectFactory.transient({ organization: savedOrganization }).build({
        name: "Playground Project",
      })
      const savedProject = await projectRepository.save(project)

      const chatBot = chatBotFactory.transient({ project: savedProject }).build({
        name: "Playground Bot",
        defaultPrompt: "You are a helpful assistant",
      })
      const savedChatBot = await chatBotRepository.save(chatBot)

      const { data: result } = await controller.createPlaygroundSession(
        mockRequest,
        savedChatBot.id,
      )

      expect(result.id).toBeDefined()
      expect(result.chatBotId).toBe(savedChatBot.id)
      expect(result.type).toBe("playground")
      expect(result.expiresAt).not.toBeNull()
    })
  })
})
