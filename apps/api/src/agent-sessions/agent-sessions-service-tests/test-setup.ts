import type { Repository } from "typeorm"
import { Agent } from "@/agents/agent.entity"
import { agentFactory } from "@/agents/agent.factory"
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
import { AgentSession } from "../agent-session.entity"
import { AgentSessionsModule } from "../agent-sessions.module"
import { AgentSessionsService } from "../agent-sessions.service"
import { ChatMessage } from "../chat-message.entity"

export function agentSessionControllerTestSetup() {
  let service: AgentSessionsService
  let agentSessionRepository: Repository<AgentSession>
  let agentRepository: Repository<Agent>
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
  let testAgent: Agent

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      featureEntities: [AgentSession, Agent, User, Organization, Project, UserMembership],
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
    chatMessageRepository = setup.getRepository(ChatMessage)
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

    const agent = agentFactory.transient({ project: testProject }).build({
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
      chatMessageRepository,
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
