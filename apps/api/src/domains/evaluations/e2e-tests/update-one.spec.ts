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
import { setupUserGuardForTesting } from "../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../test/request"

describe("Evaluations - updateOne", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let organizationId: string
  let projectId: string
  let evaluationId: string
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

  const createContext = async () => {
    const { user, organization, project } = await createOrganizationWithProject(repositories)
    organizationId = organization.id
    projectId = project.id
    auth0Id = user.auth0Id
  }

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

  const subject = async (payload?: typeof EvaluationsRoutes.updateOne.request) =>
    request({
      route: EvaluationsRoutes.updateOne,
      pathParams: removeNullish({ organizationId, projectId, evaluationId }),
      token: accessToken,
      request: payload,
    })

  const fetchEvaluation = async () => {
    const listRes = await request({
      route: EvaluationsRoutes.getAll,
      pathParams: removeNullish({ organizationId, projectId }),
      token: accessToken,
    })
    return listRes.body.data.evaluations.find((evaluation) => evaluation.id === evaluationId)
  }

  it("should update evaluation with valid payload", async () => {
    await createContext()
    await createEvaluation({
      input: "original input",
      expectedOutput: "original output",
    })

    const res = await subject({
      payload: {
        input: "updated input",
        expectedOutput: "updated output",
      },
    })
    expectResponse(res)
    expect(res.body.data).toMatchObject({
      success: true,
    })
  })

  it("should update only input field", async () => {
    await createContext()
    await createEvaluation({
      input: "original input",
      expectedOutput: "original output",
    })

    const res = await subject({
      payload: {
        input: "partially updated input",
      },
    })
    expectResponse(res)

    const updated = await fetchEvaluation()
    expect(updated?.input).toBe("partially updated input")
  })

  it("should update only expectedOutput field", async () => {
    await createContext()
    await createEvaluation({
      input: "original input",
      expectedOutput: "original output",
    })

    const res = await subject({
      payload: {
        expectedOutput: "partially updated output",
      },
    })
    expectResponse(res)

    const updated = await fetchEvaluation()
    expect(updated?.expectedOutput).toBe("partially updated output")
  })

  it("should preserve other fields when updating", async () => {
    await createContext()
    await createEvaluation({
      input: "original input",
      expectedOutput: "original output",
    })

    const before = await fetchEvaluation()
    const originalCreatedAt = before?.createdAt

    await subject({
      payload: {
        input: "new input value",
      },
    })

    const after = await fetchEvaluation()
    expect(after?.createdAt).toBe(originalCreatedAt)
    expect(after?.updatedAt).toBeGreaterThanOrEqual(before?.updatedAt || 0)
  })
})
