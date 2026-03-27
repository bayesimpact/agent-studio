import { randomUUID } from "node:crypto"
import { ExtractionAgentSessionsRoutes } from "@caseai-connect/api-contracts"
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
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import { AgentsModule } from "../../agents.module"

const mockLlmProvider = {
  streamChatResponse: jest.fn(),
  generateChatResponse: jest.fn(),
  generateStructuredOutput: jest.fn().mockResolvedValue({ fullName: "Jane Doe" }),
}

// FIXME: Why is it skipped? @Olivier @did ??
describe.skip("ExtractionAgentSessions - Auth", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories

  let organizationId: string | null = "random-organization-id"
  let projectId: string | null = "random-project-id"
  let agentId: string | null = "random-agent-id"
  let runId: string | null = "random-run-id"
  let accessToken: string | null = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [AgentsModule],
      applyOverrides: (moduleBuilder) =>
        setupUserGuardForTesting(moduleBuilder, () => auth0Id)
          .overrideProvider("LLMProvider")
          .useValue(mockLlmProvider),
    })
    repositories = setup.getAllRepositories()
    app = setup.module.createNestApplication()
    await app.init()
    request = testRequester(app)
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    organizationId = "random-organization-id"
    projectId = "random-project-id"
    agentId = "random-agent-id"
    runId = randomUUID()
    accessToken = "token"
    auth0Id = "auth0|123"
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    app.close()
  })

  const createContextForRole = async (role: "owner" | "admin" | "member" = "owner") => {
    const { user, organization, project, agent } = await createOrganizationWithAgent(repositories, {
      organizationMembership: { role },
      agent: {
        type: "extraction",
        outputJsonSchema: {
          type: "object",
          properties: { fullName: { type: "string" } },
          required: ["fullName"],
        },
      },
    })
    organizationId = organization.id
    projectId = project.id
    agentId = agent.id
    auth0Id = user.auth0Id
  }

  describe("ExtractionAgentSessionsRoutes.executeOne", () => {
    const subject = async () =>
      request({
        route: ExtractionAgentSessionsRoutes.executeOne,
        pathParams: removeNullish({ organizationId, projectId, agentId }),
        token: accessToken ?? undefined,
        request: {
          payload: {
            documentId: randomUUID(),
            type: "playground",
          },
        },
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

    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })

    it("does not allow a simple member", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })

  describe("ExtractionAgentSessionsRoutes.getAll", () => {
    const subject = async () =>
      request({
        route: ExtractionAgentSessionsRoutes.getAll,
        pathParams: removeNullish({ organizationId, projectId, agentId }),
        token: accessToken ?? undefined,
        request: { payload: { type: "playground" } },
      })

    it("requires authentication", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })

    it("does not allow a simple member", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })

  describe("ExtractionAgentSessionsRoutes.getOne", () => {
    const subject = async () =>
      request({
        route: ExtractionAgentSessionsRoutes.getOne,
        pathParams: removeNullish({ organizationId, projectId, agentId, runId }),
        token: accessToken ?? undefined,
        request: { payload: { type: "playground" } },
      })

    it("requires authentication", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })

    it("does not allow a simple member", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })
})
