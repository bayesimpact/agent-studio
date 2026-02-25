import { EvaluationsRoutes } from "@caseai-connect/api-contracts"
import { afterAll } from "@jest/globals"
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

describe("Evaluations - deleteOne", () => {
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
    await sdk.shutdown()
    await app.close()
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

  const subject = async () =>
    request({
      route: EvaluationsRoutes.deleteOne,
      pathParams: removeNullish({ organizationId, projectId, evaluationId }),
      token: accessToken,
    })

  const fetchEvaluation = async (id: string) => {
    const listRes = await request({
      route: EvaluationsRoutes.getAll,
      pathParams: removeNullish({ organizationId, projectId }),
      token: accessToken,
    })
    return listRes.body.data.evaluations.find((evaluation) => evaluation.id === id)
  }

  it("should delete evaluation successfully", async () => {
    await createContext()
    await createEvaluation({
      input: "test input",
      expectedOutput: "test output",
    })

    const res = await subject()

    expectResponse(res)
    expect(res.body.data).toMatchObject({
      success: true,
    })
  })

  it("should return 500 when deleting non-existent evaluation", async () => {
    await createContext()
    await createEvaluation({
      input: "test input",
      expectedOutput: "test output",
    })

    const res = await request({
      route: EvaluationsRoutes.deleteOne,
      pathParams: removeNullish({
        organizationId,
        projectId,
        evaluationId: "non-existent-id",
      }),
      token: accessToken,
    })
    expectResponse(res, 500)
  })

  it("should remove evaluation from list after deletion", async () => {
    await createContext()

    const createRes = await createEvaluation({
      input: "test input for deletion",
      expectedOutput: "test output for deletion",
    })
    const newEvaluationId = createRes.body.data.id

    const foundBefore = await fetchEvaluation(newEvaluationId)
    expect(foundBefore).toBeDefined()

    await request({
      route: EvaluationsRoutes.deleteOne,
      pathParams: removeNullish({
        organizationId,
        projectId,
        evaluationId: newEvaluationId,
      }),
      token: accessToken,
    })

    const foundAfter = await fetchEvaluation(newEvaluationId)
    expect(foundAfter).toBeUndefined()
  })

  it("should return 404 when trying to delete already deleted evaluation", async () => {
    await createContext()

    const createRes = await createEvaluation({
      input: "test input",
      expectedOutput: "test output",
    })
    const idToDelete = createRes.body.data.id

    await request({
      route: EvaluationsRoutes.deleteOne,
      pathParams: removeNullish({ organizationId, projectId, evaluationId: idToDelete }),
      token: accessToken,
    })

    const res = await request({
      route: EvaluationsRoutes.deleteOne,
      pathParams: removeNullish({ organizationId, projectId, evaluationId: idToDelete }),
      token: accessToken,
    })
    expectResponse(res, 404)
  })
})
