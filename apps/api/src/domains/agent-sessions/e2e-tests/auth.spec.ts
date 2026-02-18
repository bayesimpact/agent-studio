import { randomUUID } from "node:crypto"
import { AgentSessionsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { setupUserGuardForTesting } from "../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../test/request"
import { AgentSessionsModule } from "../agent-sessions.module"

describe("Agent Sessions - Auth", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  // Variables for the tests
  let organizationId: string | null = randomUUID()
  let projectId: string | null = randomUUID()
  let agentId: string | null = randomUUID()
  let accessToken: string | null = "token"
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
    organizationId = randomUUID()
    agentId = randomUUID()
    accessToken = "token"
    auth0Id = "auth0|123"
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    app.close()
  })

  const _createContextForRole = async (role: "owner" | "admin" | "member" = "owner") => {
    const { user, organization, project, agent } = await createOrganizationWithAgent(repositories, {
      membership: { role },
    })
    organizationId = organization.id
    projectId = project.id
    agentId = agent.id
    accessToken = "token"
    auth0Id = user.auth0Id
  }

  describe("AgentSessionsRoutes.getAllPlaygroundSessions", () => {
    const subject = async () =>
      request({
        route: AgentSessionsRoutes.getAllPlaygroundSessions,
        pathParams: removeNullish({ organizationId, projectId, agentId }),
        token: accessToken ?? undefined,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })

    // it("requires a valid organization ID", async () => {
    //   organizationId = null
    //   expectResponse(await subject(), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    // })
    // it("requires a valid project ID", async () => {
    //   await createContextForRole("owner")
    //   projectId = null
    //   expectResponse(await subject(), 404)
    // })

    // it("requires a valid agent ID", async () => {
    //   await createContextForRole("owner")
    //   agentId = randomUUID()
    //   expectResponse(await subject(), 404)
    // })

    // it("requires the user to be a member of the organization", async () => {
    //   await createContextForRole("owner")
    //   auth0Id = "another-auth0-id"
    //   expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    // })

    // it("doesn't allow a simple member to get all playground sessions", async () => {
    //   await createContextForRole("member")
    //   expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    // })

    // it("allows admins to get all playground sessions", async () => {
    //   await createContextForRole("admin")
    //   expectResponse(await subject(), 200)
    // })
  })
})
