import { AgentSessionsRoutes } from "@caseai-connect/api-contracts"
import { afterAll } from "@jest/globals"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { createProjectMembership } from "@/domains/projects/memberships/project-membership.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { setupUserGuardForTesting } from "../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../test/request"
import { agentSessionFactory } from "../agent-session.factory"
import { AgentSessionsModule } from "../agent-sessions.module"

describe("AgentSessionsRoutes.getAllPlaygroundSessions", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let organizationId: string
  let projectId: string
  let agentId: string
  let accessToken: string | undefined = "token"
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
    accessToken = "token"
    auth0Id = "auth0|123"
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    await sdk.shutdown()
    app.close()
  })

  const createContext = async () => {
    const { user, organization, project, agent } = await createOrganizationWithAgent(repositories)
    const { invitedUser: anotherUser } = await createProjectMembership({
      repositories,
      organization,
      project,
      user: {
        email: "another-user@caseai.test",
        auth0Id: "auth0|another-user",
      },
    })

    const oldestPlaygroundSession = agentSessionFactory
      .transient({
        organization,
        project,
        user,
        agent,
      })
      .playground()
      .build({
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      })

    const newestPlaygroundSession = agentSessionFactory
      .transient({
        organization,
        project,
        user,
        agent,
      })
      .playground()
      .build({
        createdAt: new Date("2024-01-01T12:00:00.000Z"),
      })

    const appPrivateSession = agentSessionFactory
      .transient({
        organization,
        project,
        user,
        agent,
      })
      .appPrivate()
      .build()

    const anotherUserPlaygroundSession = agentSessionFactory
      .transient({
        organization,
        project,
        user: anotherUser,
        agent,
      })
      .playground()
      .build()

    await repositories.agentSessionRepository.save([
      oldestPlaygroundSession,
      newestPlaygroundSession,
      appPrivateSession,
      anotherUserPlaygroundSession,
    ])

    organizationId = organization.id
    projectId = project.id
    agentId = agent.id
    auth0Id = user.auth0Id

    return {
      oldestPlaygroundSession,
      newestPlaygroundSession,
    }
  }

  const subject = async () =>
    request({
      route: AgentSessionsRoutes.getAllPlaygroundSessions,
      pathParams: removeNullish({ organizationId, projectId, agentId }),
      token: accessToken,
    })

  it("should return only playground sessions for authenticated user sorted by newest first", async () => {
    const { oldestPlaygroundSession, newestPlaygroundSession } = await createContext()

    const response = await subject()

    expectResponse(response, 200)
    const sessions = response.body.data
    expect(sessions).toHaveLength(2)
    expect(sessions[0]?.id).toBe(newestPlaygroundSession.id)
    expect(sessions[1]?.id).toBe(oldestPlaygroundSession.id)
    expect(sessions.every((session) => session.type === "playground")).toBeTruthy()
    expect(sessions.every((session) => session.agentId === agentId)).toBeTruthy()
    expect(sessions.every((session) => Boolean(session.traceUrl))).toBeTruthy()
  })
})
