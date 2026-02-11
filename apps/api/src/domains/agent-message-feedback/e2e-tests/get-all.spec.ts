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
import { setupUserGuardForTesting } from "../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../test/request"
import { agentMessageFeedbackFactory } from "../agent-message-feedback.factory"
import { AgentMessageFeedbackModule } from "../agent-message-feedback.module"

describe("AgentMessageFeedbackRoutes.getAll", () => {
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
    const { user, organization, project, agent, agentMessage } =
      await createOrganizationWithAgentMessage(repositories)
    organizationId = organization.id
    projectId = project.id
    agentId = agent.id
    auth0Id = user.auth0Id
    return { user, organization, project, agentMessage }
  }

  const subject = async () =>
    request({
      route: AgentMessageFeedbackRoutes.getAll,
      pathParams: removeNullish({ organizationId, projectId, agentId }),
      token: accessToken,
    })

  it("should return feedback for an agent", async () => {
    const { user, organization, project, agentMessage } = await createContext()

    const feedback1 = agentMessageFeedbackFactory
      .transient({ user, organization, project, agentMessage })
      .build({
        content: "Feedback 1",
      })

    const feedback2 = agentMessageFeedbackFactory
      .transient({ user, organization, project, agentMessage })
      .build({
        content: "Feedback 2",
      })

    await repositories.agentMessageFeedbackRepository.save([feedback1, feedback2])

    const response = await subject()

    expectResponse(response, 200)
    const { feedbacks } = response.body.data
    expect(feedbacks).toHaveLength(2)
    expect(feedbacks.map((feedback) => feedback.content)).toContain("Feedback 1")
    expect(feedbacks.map((feedback) => feedback.content)).toContain("Feedback 2")
    expect(feedbacks[0]).toHaveProperty("id")
    expect(feedbacks[0]).toHaveProperty("createdAt")
  })
})
