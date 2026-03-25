import { ConversationAgentSessionsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { inviteUserToProject } from "@/domains/projects/memberships/project-membership.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import { ConversationAgentSessionsModule } from "../conversation-agent-sessions.module"

// Mock Langfuse to avoid dynamic import issues in Jest
jest.mock("langfuse", () => {
  return {
    Langfuse: class {
      shutdownAsync() {
        return Promise.resolve()
      }
      flushAsync() {
        return Promise.resolve()
      }
      trace() {
        return { update: jest.fn() }
      }
    },
  }
})
jest.mock("langfuse-v2", () => ({
  Langfuse: jest.fn().mockImplementation(() => ({
    trace: jest.fn(),
    span: jest.fn().mockReturnValue({ getTraceUrl: jest.fn() }),
    generation: jest.fn(),
    flushAsync: jest.fn().mockResolvedValue(undefined),
    shutdownAsync: jest.fn().mockResolvedValue(undefined),
    debug: jest.fn(),
  })),
}))

describe("ConversationAgentSessionsRoutes.createOne", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories

  let organizationId: string
  let projectId: string
  let agentId: string
  let accessToken: string | undefined = "token"
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
    accessToken = "token"
    auth0Id = "auth0|123"
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    await sdk.shutdown()
    await app.close()
  })

  const createContext = async (role: "owner" | "member" | "admin") => {
    const { organization, project, agent } = await createOrganizationWithAgent(repositories, {
      organizationMembership: { role },
    })
    const { invitedUser } = await inviteUserToProject({
      repositories,
      organization,
      project,
      projectMembership: { role },
    })

    organizationId = organization.id
    projectId = project.id
    agentId = agent.id
    auth0Id = invitedUser.auth0Id
  }

  const subject = async (payload?: typeof ConversationAgentSessionsRoutes.createOne.request) =>
    request({
      route: ConversationAgentSessionsRoutes.createOne,
      pathParams: removeNullish({ organizationId, projectId, agentId }),
      token: accessToken,
      request: payload,
    })

  describe("creating a live session", () => {
    it("should create a live session", async () => {
      await createContext("member")

      const response = await subject({ payload: { type: "live" } })

      expectResponse(response, 201)
      expect(response.body.data.id).toBeDefined()
      expect(response.body.data.agentId).toBe(agentId)
      expect(response.body.data.type).toBe("live")
      expect(response.body.data.createdAt).toBeDefined()
      expect(response.body.data.updatedAt).toBeDefined()

      const createdSession = await repositories.conversationAgentSessionRepository.findOne({
        where: { id: response.body.data.id },
      })
      expect(createdSession).not.toBeNull()
    })
  })
  describe("creating a playground session", () => {
    it("should create a playground session", async () => {
      await createContext("owner")

      const response = await subject({ payload: { type: "playground" } })

      expectResponse(response, 201)
      expect(response.body.data.id).toBeDefined()
      expect(response.body.data.agentId).toBe(agentId)
      expect(response.body.data.type).toBe("playground")
      expect(response.body.data.createdAt).toBeDefined()
      expect(response.body.data.updatedAt).toBeDefined()

      const createdSession = await repositories.conversationAgentSessionRepository.findOne({
        where: { id: response.body.data.id },
      })
      expect(createdSession).not.toBeNull()
    })
  })
})
