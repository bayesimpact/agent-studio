import type { Repository } from "typeorm"
import { Agent } from "@/agents/agent.entity"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import { createOrganizationWithAgentSession } from "@/organizations/organization.factory"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import type { EndpointRequest } from "@/request.interface"
import { User } from "@/users/user.entity"
import { AgentSession } from "./agent-session.entity"
import { AgentSessionsModule } from "./agent-sessions.module"
import { ChatMessage } from "./chat-message.entity"
import { ChatMessagesController } from "./chat-messages.controller"
import { createChitChatConversation } from "./chat-messages.factory"

describe("ChatMessagesController", () => {
  let controller: ChatMessagesController
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let projectRepository: Repository<Project>
  let agentRepository: Repository<Agent>
  let agentSessionRepository: Repository<AgentSession>
  let chatMessageRepository: Repository<ChatMessage>

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      featureEntities: [
        User,
        Organization,
        UserMembership,
        Project,
        Agent,
        AgentSession,
        ChatMessage,
      ],
      additionalImports: [AgentSessionsModule],
    })
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
    agentRepository = setup.getRepository(Agent)
    agentSessionRepository = setup.getRepository(AgentSession)
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
      const { user, agentSession: session } = await createOrganizationWithAgentSession({
        organizationRepository,
        userRepository,
        membershipRepository,
        projectRepository,
        agentRepository,
        agentSessionRepository,
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
