import type { Repository } from "typeorm"
import { ChatBot } from "@/chat-bots/chat-bot.entity"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import { organizationFactory } from "@/organizations/organization.factory"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { User } from "@/users/user.entity"
import { ChatBotsController } from "../chat-bots.controller"
import { ChatBotsModule } from "../chat-bots.module"

export function chatBotsControllerTestSetup() {
  let controller: ChatBotsController
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let projectRepository: Repository<Project>
  let chatBotRepository: Repository<ChatBot>
  let organization: Organization

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase(
      [User, Organization, UserMembership, Project, ChatBot],
      [],
      [ChatBotsModule],
    )
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    await setup.startTransaction()
    controller = setup.module.get<ChatBotsController>(ChatBotsController)
    userRepository = setup.getRepository(User)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    projectRepository = setup.getRepository(Project)
    chatBotRepository = setup.getRepository(ChatBot)

    const org = organizationFactory.build({ name: "Org1" })
    organization = await organizationRepository.save(org)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
    await clearTestDatabase(setup.dataSource)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  return () => {
    return {
      organizationRepository,
      userRepository,
      membershipRepository,
      projectRepository,
      chatBotRepository,
      controller,
      organization,
    }
  }
}
