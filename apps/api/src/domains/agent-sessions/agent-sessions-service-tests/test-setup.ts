import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Agent } from "@/domains/agents/agent.entity"
import { agentFactory } from "@/domains/agents/agent.factory"
import { Organization } from "@/domains/organizations/organization.entity"
import { organizationFactory } from "@/domains/organizations/organization.factory"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { projectFactory } from "@/domains/projects/project.factory"
import { User } from "@/domains/users/user.entity"
import { userFactory } from "@/domains/users/user.factory"
import { AgentMessage } from "../agent-message.entity"
import { AgentSession } from "../agent-session.entity"
import { AgentSessionsModule } from "../agent-sessions.module"
import { AgentSessionsService } from "../agent-sessions.service"

export function agentSessionControllerTestSetup() {
  let service: AgentSessionsService
  let agentSessionRepository: Repository<AgentSession>
  let agentRepository: Repository<Agent>
  let agentMessageRepository: Repository<AgentMessage>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let projectRepository: Repository<Project>
  let membershipRepository: Repository<UserMembership>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>

  // Test data
  let testUser: User
  let testOrganization: Organization
  let testProject: Project
  let testAgent: Agent

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [AgentSessionsModule],
    })
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    await setup.startTransaction()
    service = setup.module.get<AgentSessionsService>(AgentSessionsService)
    agentSessionRepository = setup.getRepository(AgentSession)
    agentMessageRepository = setup.getRepository(AgentMessage)
    agentRepository = setup.getRepository(Agent)
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

    const agent = agentFactory
      .transient({ organization: testOrganization, project: testProject })
      .build({
        name: `Test Agent ${uniqueId}`,
        defaultPrompt: "You are a helpful assistant",
        temperature: 0,
      })
    testAgent = agentRepository.create(agent)
    testAgent = await agentRepository.save(testAgent)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
    await clearTestDatabase(setup.dataSource)
  })

  return () => {
    return {
      agentRepository,
      agentSessionRepository,
      agentMessageRepository,
      membershipRepository,
      organizationRepository,
      projectRepository,
      service,
      testAgent,
      testOrganization,
      testProject,
      testUser,
      userRepository,
    }
  }
}
