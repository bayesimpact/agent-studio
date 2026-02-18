// biome-ignore lint/style/useImportType: this is a class, not a type
import { Repository } from "typeorm"
import type { EndpointRequest } from "@/common/context/request.interface"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Agent } from "@/domains/agents/agent.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { createOrganizationWithAgentSession } from "@/domains/organizations/organization.factory"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { User } from "@/domains/users/user.entity"
import { AgentMessage } from "./agent-message.entity"
import { AgentMessagesController } from "./agent-messages.controller"
import { createChitChatConversation } from "./agent-messages.factory"
import { AgentSession } from "./agent-session.entity"
import { AgentSessionsModule } from "./agent-sessions.module"

describe("AgentMessagesController", () => {
  let controller: AgentMessagesController
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let projectRepository: Repository<Project>
  let agentRepository: Repository<Agent>
  let agentSessionRepository: Repository<AgentSession>
  let agentMessageRepository: Repository<AgentMessage>

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
    controller = setup.module.get<AgentMessagesController>(AgentMessagesController)
    userRepository = setup.getRepository(User)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    projectRepository = setup.getRepository(Project)
    agentRepository = setup.getRepository(Agent)
    agentSessionRepository = setup.getRepository(AgentSession)
    agentMessageRepository = setup.getRepository(AgentMessage)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("listMessages", () => {
    it("should return messages for a session", async () => {
      const {
        user,
        agentSession: session,
        organization,
        project,
      } = await createOrganizationWithAgentSession({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
        agentRepository,
        agentSessionRepository,
      })

      // add 2 messages (from the assistant and the user) to the session
      await createChitChatConversation(organization, project, session, { agentMessageRepository })

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
