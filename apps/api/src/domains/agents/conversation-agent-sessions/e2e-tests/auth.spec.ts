import { randomUUID } from "node:crypto"
import { ConversationAgentSessionsRoutes } from "@caseai-connect/api-contracts"
import { afterAll } from "@jest/globals"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import { ConversationAgentSessionsModule } from "../conversation-agent-sessions.module"

describe("Agent Sessions - Auth", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories

  // Variables for the tests
  let organizationId: string | null = randomUUID()
  let projectId: string | null = randomUUID()
  let agentId: string | null = randomUUID()
  let accessToken: string | null = "token"
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
    organizationId = randomUUID()
    projectId = randomUUID()
    agentId = randomUUID()
    accessToken = "token"
    auth0Id = "auth0|123"
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    await sdk.shutdown()
    await app.close()
  })

  const createContextForRole = async (role: "owner" | "admin" | "member" = "owner") => {
    const { user, organization, project, agent } = await createOrganizationWithAgent(repositories, {
      projectMembership: { role },
    })
    organizationId = organization.id
    projectId = project.id
    agentId = agent.id
    accessToken = "token"
    auth0Id = user.auth0Id
  }

  describe("ConversationAgentSessionsRoutes.createOne", () => {
    const subject = async (type: "playground" | "live") =>
      request({
        route: ConversationAgentSessionsRoutes.createOne,
        pathParams: removeNullish({ organizationId, projectId, agentId }),
        token: accessToken ?? undefined,
        request: { payload: { type } },
      })

    describe("creating a live session", () => {
      it("requires an authentication token", async () => {
        accessToken = null
        expectResponse(await subject("live"), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
      })

      it("requires a valid organization ID", async () => {
        organizationId = null
        expectResponse(await subject("live"), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
      })
      it("requires a valid agent ID", async () => {
        await createContextForRole("member")
        agentId = null
        expectResponse(await subject("live"), 404)
      })

      it("requires the user to be a member of the organization", async () => {
        await createContextForRole("member")
        auth0Id = "another-auth0-id"
        expectResponse(await subject("live"), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
      })

      it("allows members to create live sessions", async () => {
        await createContextForRole("member")
        expectResponse(await subject("live"), 201)
      })

      it("allows owners to create live sessions", async () => {
        await createContextForRole("owner")
        expectResponse(await subject("live"), 201)
      })
    })
    describe("creating a playground session", () => {
      it("requires an authentication token", async () => {
        accessToken = null
        expectResponse(await subject("playground"), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
      })

      it("requires a valid organization ID", async () => {
        organizationId = null
        expectResponse(await subject("playground"), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
      })
      it("requires a valid agent ID", async () => {
        await createContextForRole("member")
        agentId = null
        expectResponse(await subject("playground"), 404)
      })

      it("requires the user to be a member of the organization", async () => {
        await createContextForRole("member")
        auth0Id = "another-auth0-id"
        expectResponse(await subject("playground"), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
      })

      it("doesn't allow a simple member to create playground sessions", async () => {
        await createContextForRole("member")
        expectResponse(await subject("playground"), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
      })

      it("allows owners to create playground sessions", async () => {
        await createContextForRole("owner")
        expectResponse(await subject("playground"), 201)
      })
    })
  })

  describe("ConversationAgentSessionsRoutes.getAll", () => {
    const subject = async (type: "playground" | "live") =>
      request({
        route: ConversationAgentSessionsRoutes.getAll,
        pathParams: removeNullish({ organizationId, projectId, agentId }),
        token: accessToken ?? undefined,
        request: { payload: { type } },
      })
    describe("getting a live sessions", () => {
      it("requires an authentication token", async () => {
        accessToken = null
        expectResponse(await subject("live"), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
      })
      it("requires a valid organization ID", async () => {
        organizationId = null
        expectResponse(await subject("live"), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
      })
      it("requires a valid agent ID", async () => {
        await createContextForRole("member")
        agentId = null
        expectResponse(await subject("live"), 404)
      })
      it("allows members to get live sessions", async () => {
        await createContextForRole("member")
        expectResponse(await subject("live"), 201)
      })
      it("allows owners to get live sessions", async () => {
        await createContextForRole("owner")
        expectResponse(await subject("live"), 201)
      })
      it("requires the user to be a member of the organization", async () => {
        await createContextForRole("member")
        auth0Id = "another-auth0-id"
        expectResponse(await subject("live"), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
      })
    })
    describe("getting a playground sessions", () => {
      it("requires an authentication token", async () => {
        accessToken = null
        expectResponse(await subject("playground"), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
      })
      it("requires a valid organization ID", async () => {
        organizationId = null
        expectResponse(await subject("playground"), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
      })
      it("requires a valid agent ID", async () => {
        await createContextForRole("owner")
        agentId = null
        expectResponse(await subject("playground"), 404)
      })
      it("doesn't allow simple member to get playground sessions", async () => {
        await createContextForRole("member")
        expectResponse(await subject("playground"), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
      })
      it("allows owner to get playground sessions", async () => {
        await createContextForRole("owner")
        expectResponse(await subject("playground"), 201)
      })
      it("requires the user to be a member of the organization", async () => {
        await createContextForRole("owner")
        auth0Id = "another-auth0-id"
        expectResponse(await subject("playground"), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
      })
    })
  })
})
