import { EvaluationsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { EvaluationsModule } from "@/domains/evaluations/evaluations.module"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { setupUserGuardForTesting } from "../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../test/request"

describe("Evaluations - getAll", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let organizationId: string
  let projectId: string
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
    await sdk.shutdown()
    app.close()
  })

  const createContext = async () => {
    const { user, organization, project } = await createOrganizationWithProject(repositories)
    organizationId = organization.id
    projectId = project.id
    auth0Id = user.auth0Id
    return { organization, project }
  }

  const createEvaluation = async (payload: { input: string; expectedOutput: string }) =>
    request({
      route: EvaluationsRoutes.createOne,
      pathParams: removeNullish({ organizationId, projectId }),
      token: accessToken,
      request: { payload },
    })

  const subject = async () =>
    request({
      route: EvaluationsRoutes.getAll,
      pathParams: removeNullish({ organizationId, projectId }),
      token: accessToken,
    })

  it("should return list of evaluations", async () => {
    await createContext()

    const res1 = await createEvaluation({
      input: "input 1",
      expectedOutput: "output 1",
    })
    const res2 = await createEvaluation({
      input: "input 2",
      expectedOutput: "output 2",
    })
    expectResponse(res1, 201)
    expectResponse(res2, 201)

    const res = await subject()

    expectResponse(res)
    expect(res.body.data.evaluations).toBeDefined()
    expect(res.body.data.evaluations).toHaveLength(2)
    expect(res.body.data.evaluations.map((evaluation) => evaluation.input)).toContain("input 1")
    expect(res.body.data.evaluations.map((evaluation) => evaluation.input)).toContain("input 2")
    expect(res.body.data.evaluations[0]).toHaveProperty("id")
    expect(res.body.data.evaluations[0]).toHaveProperty("createdAt")
    expect(res.body.data.evaluations[0]).toHaveProperty("updatedAt")
  })

  it("should return empty list when no evaluations exist", async () => {
    await createContext()

    const res = await subject()

    expectResponse(res)
    expect(res.body.data.evaluations).toEqual([])
  })

  it("should return evaluations with all required fields", async () => {
    await createContext()

    const createRes = await createEvaluation({
      input: "test input",
      expectedOutput: "test output",
    })
    const createdId = createRes.body.data.id

    const res = await subject()

    expectResponse(res)
    expect(res.body.data.evaluations.length).toBeGreaterThan(0)

    const found = res.body.data.evaluations.find((evaluation) => evaluation.id === createdId)
    expect(found).toBeDefined()
    expect(found).toMatchObject({
      id: expect.any(String),
      input: expect.any(String),
      expectedOutput: expect.any(String),
      projectId,
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    })
  })
})
