import { AgentSessionMessagesRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { createOrganizationWithAgentSession } from "@/domains/organizations/organization.factory"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { type Requester, testRequester } from "../../../../../test/request"
import { AgentSessionsModule } from "../../agent-sessions.module"
import { createChitChatConversation } from "../agent-messages.factory"

describe("AgentSessionMessagesRoutes.listMessages", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let organizationId: string
  let projectId: string
  let agentId: string
  let agentSessionId: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [AgentSessionsModule],
      applyOverrides: (moduleBuilder) => setupUserGuardForTesting(moduleBuilder, () => auth0Id),
    })
    repositories = setup.getAllRepositories()
    app = setup.module.createNestApplication()
    await app.init()
    request = testRequester(app)
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    accessToken = "token"
    auth0Id = "auth0|123"
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    app.close()
  })

  const createContext = async () => {
    const { organization, user, project, agent, agentSession } =
      await createOrganizationWithAgentSession(repositories)

    // add 2 messages (from the assistant and the user) to the session
    await createChitChatConversation(organization, project, agentSession, {
      agentMessageRepository: repositories.agentMessageRepository,
    })

    organizationId = organization.id
    projectId = project.id
    agentId = agent.id
    agentSessionId = agentSession.id
    auth0Id = user.auth0Id

    return { organization, user, project, agent, agentSession }
  }

  const subject = async () =>
    request({
      route: AgentSessionMessagesRoutes.listMessages,
      pathParams: removeNullish({ organizationId, projectId, agentId, agentSessionId }),
      token: accessToken,
    })

  describe("listMessages", () => {
    it("should return messages for a session", async () => {
      await createContext()

      const response = await subject()

      expect(response.status).toBe(200)
      const messages = response.body.data
      expect(messages).toHaveLength(2)
      expect(messages[0]?.role).toBe("user")
      expect(messages[0]?.content).toBe("Hello")
      expect(messages[1]?.role).toBe("assistant")
      expect(messages[1]?.content).toBe("Hi!")
    })
  })
})
