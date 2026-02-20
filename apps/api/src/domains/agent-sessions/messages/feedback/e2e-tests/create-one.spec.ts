import { AgentMessageFeedbackRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { createOrganizationWithAgentMessage } from "@/domains/organizations/organization.factory"
import { setupUserGuardForTesting } from "../../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../../test/request"
import { AgentMessageFeedbackModule } from "../agent-message-feedback.module"

describe("AgentMessageFeedbackRoutes.createOne", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let organizationId: string
  let projectId: string
  let agentMessageId: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [AgentMessageFeedbackModule],
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
    const { user, organization, project, agentMessage } = await createOrganizationWithAgentMessage(
      repositories,
      { membership: { role: "member" } },
    )
    organizationId = organization.id
    projectId = project.id
    agentMessageId = agentMessage.id
    auth0Id = user.auth0Id
    return { user, organization, project, agentMessage }
  }

  const subject = async (payload?: { content: string }) =>
    request({
      route: AgentMessageFeedbackRoutes.createOne,
      pathParams: removeNullish({ organizationId, projectId, agentMessageId }),
      token: accessToken,
      request: payload ? { payload } : undefined,
    })

  it("should create feedback for an agent message", async () => {
    await createContext()

    const response = await subject({ content: "Persisted feedback" })

    expectResponse(response, 201)
    const feedback = response.body.data

    expect(feedback.success).toBeTruthy()
  })
})
