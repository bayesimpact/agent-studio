import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { AgentSession } from "@/domains/agent-sessions/agent-session.entity"
import { Agent } from "@/domains/agents/agent.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { organizationFactory } from "@/domains/organizations/organization.factory"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { User } from "@/domains/users/user.entity"
import { AgentsController } from "../agents.controller"
import { AgentsModule } from "../agents.module"

export function agentsControllerTestSetup() {
  let controller: AgentsController
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let projectRepository: Repository<Project>
  let agentRepository: Repository<Agent>
  let agentSessionRepository: Repository<AgentSession>
  let organization: Organization

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [AgentsModule],
    })
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    await setup.startTransaction()
    controller = setup.module.get<AgentsController>(AgentsController)
    userRepository = setup.getRepository(User)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    projectRepository = setup.getRepository(Project)
    agentRepository = setup.getRepository(Agent)
    agentSessionRepository = setup.getRepository(AgentSession)

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
      agentRepository,
      agentSessionRepository,
      controller,
      organization,
    }
  }
}
