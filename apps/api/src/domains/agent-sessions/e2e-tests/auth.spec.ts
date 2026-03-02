import { randomUUID } from "node:crypto"
import { ConversationAgentSessionsRoutes } from "@caseai-connect/api-contracts"
import { afterAll } from "@jest/globals"
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
import { projectMembershipFactory } from "@/domains/projects/memberships/project-membership.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
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
      membership: { role },
    })
    await repositories.projectMembershipRepository.save(
      projectMembershipFactory
        .transient({
          project,
          user,
        })
        .build({
          status: "accepted",
        }),
    )
    organizationId = organization.id
    projectId = project.id
    agentId = agent.id
    accessToken = "token"
    auth0Id = user.auth0Id
  }

  describe("ConversationAgentSessionsRoutes.getAllPlaygroundSessions", () => {
    const subject = async () =>
      request({
        route: ConversationAgentSessionsRoutes.getAllPlaygroundSessions,
        pathParams: removeNullish({ organizationId, projectId, agentId }),
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
    it("requires a valid agent ID", async () => {
      await createContextForRole("owner")
      agentId = null
      expectResponse(await subject(), 404)
    })

    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })

    it("doesn't allow a simple member to get all playground sessions", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })

    it("allows admins to get all playground sessions", async () => {
      await createContextForRole("admin")
      expectResponse(await subject(), 200)
    })
  })

  describe("ConversationAgentSessionsRoutes.createPlaygroundSession", () => {
    const subject = async () =>
      request({
        route: ConversationAgentSessionsRoutes.createPlaygroundSession,
        pathParams: removeNullish({ organizationId, projectId, agentId }),
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
    it("requires a valid agent ID", async () => {
      await createContextForRole("owner")
      agentId = null
      expectResponse(await subject(), 404)
    })

    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })

    it("doesn't allow a simple member to create playground sessions", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })

    it("allows owners to create playground sessions", async () => {
      await createContextForRole("owner")
      expectResponse(await subject(), 201)
    })
  })

  describe("ConversationAgentSessionsRoutes.getAllAppSessions", () => {
    const subject = async () =>
      request({
        route: ConversationAgentSessionsRoutes.getAllAppSessions,
        pathParams: removeNullish({ organizationId, projectId, agentId }),
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
    it("requires a valid agent ID", async () => {
      await createContextForRole("owner")
      agentId = null
      expectResponse(await subject(), 404)
    })
    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
  })

  describe("ConversationAgentSessionsRoutes.createAppSession", () => {
    const subject = async (
      payload: typeof ConversationAgentSessionsRoutes.createAppSession.request,
    ) =>
      request({
        route: ConversationAgentSessionsRoutes.createAppSession,
        pathParams: removeNullish({ organizationId, projectId, agentId }),
        token: accessToken ?? undefined,
        request: payload,
      })

    const payload: typeof ConversationAgentSessionsRoutes.createAppSession.request = {
      payload: { agentSessionType: "app-private" },
    }

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(payload), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(payload), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires a valid agent ID", async () => {
      await createContextForRole("owner")
      agentId = null
      expectResponse(await subject(payload), 404)
    })
    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(payload), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
  })
})
