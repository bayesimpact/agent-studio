import { AgentModel, EvaluationReportsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { bindExpectActivityCreated } from "@/common/test/activity-test.helpers"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { ActivitiesModule } from "@/domains/activities/activities.module"
import { agentFactory } from "@/domains/agents/agent.factory"
import { evaluationFactory } from "@/domains/evaluations/evaluation.factory"
import { EvaluationsModule } from "@/domains/evaluations/evaluations.module"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"

describe("Evaluation Reports - createOne", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories

  let organizationId: string
  let projectId: string
  let agentId: string
  let evaluationId: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"
  let expectActivityCreated: ReturnType<typeof bindExpectActivityCreated>

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [EvaluationsModule, ActivitiesModule],
      applyOverrides: (moduleBuilder) => setupUserGuardForTesting(moduleBuilder, () => auth0Id),
    })
    repositories = setup.getAllRepositories()
    expectActivityCreated = bindExpectActivityCreated(repositories.activityRepository)
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
    const { user, organization, project } = await createOrganizationWithProject(repositories, {
      organizationMembership: { role: "owner" },
    })
    organizationId = organization.id
    projectId = project.id

    auth0Id = user.auth0Id

    const agentMock = agentFactory.transient({ organization, project }).build({
      model: AgentModel._MockGenerateText,
    })
    await repositories.agentRepository.save(agentMock)
    agentId = agentMock.id

    const evaluation = evaluationFactory.transient({ organization, project }).build({
      input: "test input",
      expectedOutput: "test output",
    })
    await repositories.evaluationRepository.save(evaluation)
    evaluationId = evaluation.id

    return { organization, project, evaluation }
  }

  const subject = async () =>
    request({
      route: EvaluationReportsRoutes.createOne,
      pathParams: removeNullish({ organizationId, projectId, agentId, evaluationId }),
      token: accessToken,
    })

  it("should create an evaluation report", async () => {
    await createContext()

    const res = await subject()
    expectResponse(res, 201)
    expect(res.body.data).toMatchObject({ agentId, evaluationId })
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.createdAt).toBeDefined()
    expect(res.body.data.updatedAt).toBeDefined()
    expect(res.body.data.output).toBe(`Hello, I'm the generateText default mock response!`) //see <default mock result for generateText>
    expect(res.body.data.score).toBe("76") //see <default mock result for generateText>
    await expectActivityCreated("evaluationReport.create")
  })
})
