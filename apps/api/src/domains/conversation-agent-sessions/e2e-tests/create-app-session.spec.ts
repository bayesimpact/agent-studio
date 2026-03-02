import { ConversationAgentSessionsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { createProjectMembership } from "@/domains/projects/memberships/project-membership.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { setupUserGuardForTesting } from "../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../test/request"
import { ConversationAgentSessionsModule } from "../conversation-agent-sessions.module"

describe("ConversationAgentSessionsRoutes.createAppSession", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let organizationId: string
  let projectId: string
  let agentId: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [ConversationAgentSessionsModule],
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
    await sdk.shutdown()
    await app.close()
  })

  const createContext = async () => {
    const { organization, project, agent } = await createOrganizationWithAgent(repositories)
    const { invitedUser } = await createProjectMembership({ repositories, organization, project })

    organizationId = organization.id
    projectId = project.id
    agentId = agent.id
    auth0Id = invitedUser.auth0Id
  }

  const subject = async (
    payload?: typeof ConversationAgentSessionsRoutes.createAppSession.request,
  ) =>
    request({
      route: ConversationAgentSessionsRoutes.createAppSession,
      pathParams: removeNullish({ organizationId, projectId, agentId }),
      token: accessToken,
      request: payload,
    })

  it("should create an app-private session and persist it", async () => {
    await createContext()

    const response = await subject({
      payload: {
        agentSessionType: "app-private",
      },
    })

    expectResponse(response, 201)
    expect(response.body.data.id).toBeDefined()
    expect(response.body.data.agentId).toBe(agentId)
    expect(response.body.data.type).toBe("app-private")
    expect(response.body.data.createdAt).toBeDefined()
    expect(response.body.data.updatedAt).toBeDefined()

    const createdSession = await repositories.conversationAgentSessionRepository.findOne({
      where: { id: response.body.data.id },
    })
    expect(createdSession).not.toBeNull()
  })
})
