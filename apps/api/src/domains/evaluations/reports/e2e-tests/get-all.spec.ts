import { EvaluationReportsRoutes, EvaluationsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { EvaluationsModule } from "@/domains/evaluations/evaluations.module"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"

describe("Evaluation Reports - getAll", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let organizationId: string
  let projectId: string
  let agentId: string
  let evaluationId: string
  let evaluationReportId: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [EvaluationsModule],
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

  const createEvaluation = async (payload: { input: string; expectedOutput: string }) => {
    const response = await request({
      route: EvaluationsRoutes.createOne,
      pathParams: removeNullish({ organizationId, projectId }),
      token: accessToken,
      request: { payload },
    })
    evaluationId = response.body.data.id
    return response
  }

  const createEvaluationReport = async () => {
    const response = await request({
      route: EvaluationReportsRoutes.createOne,
      pathParams: removeNullish({ organizationId, projectId, agentId, evaluationId }),
      token: accessToken,
    })
    evaluationReportId = response.body.data.id
    return response
  }

  const createContext = async () => {
    const { user, organization, project, agent } = await createOrganizationWithAgent(repositories)
    organizationId = organization.id
    projectId = project.id
    agentId = agent.id
    auth0Id = user.auth0Id

    await createEvaluation({
      input: "test input",
      expectedOutput: "test output",
    })

    await createEvaluationReport()
  }

  const subject = async () =>
    request({
      route: EvaluationReportsRoutes.getAll,
      pathParams: removeNullish({ organizationId, projectId, evaluationId }),
      token: accessToken,
    })

  it("should get all evaluation reports", async () => {
    await createContext()

    const res = await subject()
    expectResponse(res, 200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data).toContainEqual(expect.objectContaining({ id: evaluationReportId }))
  })
})
