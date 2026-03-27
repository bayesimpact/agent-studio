import { randomUUID } from "node:crypto"
import { EvaluationsRoutes } from "@caseai-connect/api-contracts"
import { afterAll } from "@jest/globals"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import type { Repository } from "typeorm"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { Evaluation } from "@/domains/evaluations/evaluation.entity"
import { EvaluationsModule } from "@/domains/evaluations/evaluations.module"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { projectFactory } from "@/domains/projects/project.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { setupUserGuardForTesting } from "../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../test/request"

describe("Evaluations - Auth", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories
  let evaluationRepository: Repository<Evaluation>

  // Variables for the tests
  let organizationId: string | null = randomUUID()
  let projectId: string | null = randomUUID()
  let evaluationId: string | null = randomUUID()
  let accessToken: string | null = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [EvaluationsModule],
      applyOverrides: (moduleBuilder) => setupUserGuardForTesting(moduleBuilder, () => auth0Id),
    })
    repositories = setup.getAllRepositories()
    evaluationRepository = setup.getRepository(Evaluation)
    app = setup.module.createNestApplication()
    await app.init()
    request = testRequester(app)
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    organizationId = randomUUID()
    projectId = randomUUID()
    evaluationId = randomUUID()
    accessToken = "token"
    auth0Id = "auth0|123"
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    await sdk.shutdown()
    await app.close()
  })

  const createContextForRole = async (role: "owner" | "admin" | "member" = "owner") => {
    const { user, organization, project } = await createOrganizationWithProject(repositories, {
      projectMembership: { role },
    })
    const evaluation = evaluationRepository.create({
      organizationId: organization.id,
      projectId: project.id,
      project,
      input: "test input",
      expectedOutput: "test output",
    })
    await evaluationRepository.save(evaluation)
    organizationId = organization.id
    projectId = project.id
    evaluationId = evaluation.id
    accessToken = "token"
    auth0Id = user.auth0Id
    return { organization, project, evaluation }
  }

  describe("EvaluationsRoutes.getAll", () => {
    const subject = async () =>
      request({
        route: EvaluationsRoutes.getAll,
        pathParams: removeNullish({ organizationId, projectId }),
        token: accessToken ?? undefined,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires a valid project ID", async () => {
      await createContextForRole("owner")
      projectId = null
      expectResponse(await subject(), 404)
    })
    it("requires the user to be an owner of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("doesn't allow a simple member to get all evaluations", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })

  describe("EvaluationsRoutes.createOne", () => {
    const payload: typeof EvaluationsRoutes.createOne.request = {
      payload: {
        input: "test input",
        expectedOutput: "test output",
      },
    }

    const subject = async (requestPayload?: typeof EvaluationsRoutes.createOne.request) =>
      request({
        route: EvaluationsRoutes.createOne,
        pathParams: removeNullish({ organizationId, projectId }),
        token: accessToken ?? undefined,
        request: requestPayload,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(payload), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(payload), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires a valid project ID", async () => {
      await createContextForRole("owner")
      projectId = null
      expectResponse(await subject(payload), 404)
    })
    it("requires the user to be an owner of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(payload), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("doesn't allow a simple member to create evaluations", async () => {
      await createContextForRole("member")
      expectResponse(await subject(payload), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })

  describe("EvaluationsRoutes.deleteOne", () => {
    const subject = async () =>
      request({
        route: EvaluationsRoutes.deleteOne,
        pathParams: removeNullish({ organizationId, projectId, evaluationId }),
        token: accessToken ?? undefined,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires a valid project ID", async () => {
      await createContextForRole("owner")
      projectId = randomUUID()
      expectResponse(await subject(), 404)
    })
    it("requires the user to be an owner of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("requires the evaluation to be part of the project", async () => {
      const { organization } = await createContextForRole("owner")
      const project2 = await repositories.projectRepository.save(
        projectFactory.transient({ organization }).build(),
      )
      projectId = project2.id
      expectResponse(await subject(), 404)
    })
    it("doesn't allow a simple member to delete evaluations", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })

  describe("EvaluationsRoutes.updateOne", () => {
    const payload: typeof EvaluationsRoutes.updateOne.request = {
      payload: {
        input: "updated input",
      },
    }

    const subject = async (requestPayload?: typeof EvaluationsRoutes.updateOne.request) =>
      request({
        route: EvaluationsRoutes.updateOne,
        pathParams: removeNullish({ organizationId, projectId, evaluationId }),
        token: accessToken ?? undefined,
        request: requestPayload,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(payload), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(payload), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires a valid project ID", async () => {
      await createContextForRole("owner")
      projectId = randomUUID()
      expectResponse(await subject(payload), 404)
    })
    it("requires the user to be an owner of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(payload), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("requires the evaluation to be part of the project", async () => {
      const { organization } = await createContextForRole("owner")
      const project2 = await repositories.projectRepository.save(
        projectFactory.transient({ organization }).build(),
      )
      projectId = project2.id
      expectResponse(await subject(payload), 404)
    })
    it("doesn't allow a simple member to update evaluations", async () => {
      await createContextForRole("member")
      expectResponse(await subject(payload), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })
})
