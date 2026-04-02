import { AnalyticsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { agentFactory } from "@/domains/agents/agent.factory"
import { conversationAgentSessionFactory } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.factory"
import { agentMessageFactory } from "@/domains/agents/shared/agent-session-messages/agent-messages.factory"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import { ProjectsAnalyticsModule } from "../projects-analytics.module"

describe("Projects Analytics - getConversationsPerDay", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories

  let organizationId: string
  let projectId: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"

  const day1Start = new Date("2026-01-01T00:00:00.000Z")
  const day2Start = new Date("2026-01-02T00:00:00.000Z")
  const day3Start = new Date("2026-01-03T00:00:00.000Z")
  const day3End = new Date(day3Start.getTime() + 24 * 60 * 60 * 1000 - 1)

  const expectedDays = [
    { date: day1Start.toISOString().slice(0, 10), value: 2 },
    { date: day2Start.toISOString().slice(0, 10), value: 1 },
    { date: day3Start.toISOString().slice(0, 10), value: 0 },
  ]

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [ProjectsAnalyticsModule],
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
    await app.close()
  })

  const createContext = async () => {
    const { organization, project, user } = await createOrganizationWithProject(repositories, {
      projectMembership: { role: "admin" },
    })
    organizationId = organization.id
    projectId = project.id
    auth0Id = user.auth0Id

    const agent = agentFactory.transient({ organization, project }).build()
    await repositories.agentRepository.save(agent)

    const session1Day1 = conversationAgentSessionFactory
      .transient({ organization, project, agent, user })
      .build({ createdAt: new Date(day1Start.getTime() + 3600 * 1000), updatedAt: new Date() })
    const session2Day1 = conversationAgentSessionFactory
      .transient({ organization, project, agent, user })
      .build({ createdAt: new Date(day1Start.getTime() + 2 * 3600 * 1000), updatedAt: new Date() })
    const session3Day2 = conversationAgentSessionFactory
      .transient({ organization, project, agent, user })
      .build({ createdAt: new Date(day2Start.getTime() + 3600 * 1000), updatedAt: new Date() })

    await repositories.conversationAgentSessionRepository.save([
      session1Day1,
      session2Day1,
      session3Day2,
    ])

    await repositories.agentMessageRepository.save([
      agentMessageFactory
        .user()
        .transient({ organization, project, session: session1Day1 })
        .build({ createdAt: new Date(day1Start.getTime() + 10 * 60 * 1000) }),
      agentMessageFactory
        .user()
        .transient({ organization, project, session: session1Day1 })
        .build({ createdAt: new Date(day1Start.getTime() + 20 * 60 * 1000) }),
      ...Array.from({ length: 4 }, (_value, messageIndex) =>
        agentMessageFactory
          .user()
          .transient({ organization, project, session: session3Day2 })
          .build({
            createdAt: new Date(day2Start.getTime() + (messageIndex + 1) * 5 * 60 * 1000),
          }),
      ),
    ])
  }

  const subject = async () =>
    request({
      route: AnalyticsRoutes.getConversationsPerDay,
      pathParams: removeNullish({ organizationId, projectId }),
      token: accessToken,
      query: {
        startAt: String(day1Start.getTime()),
        endAt: String(day3End.getTime()),
      },
    })

  it("returns conversations per day including zeros", async () => {
    await createContext()
    const response = await subject()
    expectResponse(response, 200)
    expect(response.body.data).toEqual(expectedDays)
  })
})
