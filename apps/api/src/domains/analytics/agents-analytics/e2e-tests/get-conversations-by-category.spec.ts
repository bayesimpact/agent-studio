import { randomUUID } from "node:crypto"
import { AgentAnalyticsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import {
  type AllRepositories,
  clearTestDatabase,
  setupE2eTestDatabase,
  teardownE2eTestDatabase,
} from "@/common/test/test-database"
import { removeNullish } from "@/common/utils/remove-nullish"
import { AgentCategory } from "@/domains/agents/categories/agent-category.entity"
import { conversationAgentSessionFactory } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.factory"
import { ConversationAgentSessionCategory } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session-category.entity"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import { AgentsAnalyticsModule } from "../agents-analytics.module"

describe("Agents Analytics - getConversationsByCategory", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupE2eTestDatabase>>
  let repositories: AllRepositories

  let organizationId: string
  let projectId: string
  let agentId: string
  let accessToken: string | undefined = "token"
  let auth0Id = `auth0|${randomUUID()}`

  const dayStart = new Date("2026-01-01T00:00:00.000Z")
  const dayEnd = new Date("2026-01-01T23:59:59.999Z")

  beforeAll(async () => {
    setup = await setupE2eTestDatabase({
      additionalImports: [AgentsAnalyticsModule],
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
    auth0Id = `auth0|${randomUUID()}`
  })

  afterAll(async () => {
    await teardownE2eTestDatabase(setup)
    await app.close()
  })

  const createContext = async () => {
    const { organization, project, user, agent } = await createOrganizationWithAgent(repositories, {
      user: { auth0Id },
    })
    organizationId = organization.id
    projectId = project.id
    agentId = agent.id

    const billingCategory = await setup
      .getRepository(AgentCategory)
      .save({ agentId: agent.id, name: "billing" })
    const supportCategory = await setup
      .getRepository(AgentCategory)
      .save({ agentId: agent.id, name: "support" })
    const deprecatedCategory = await setup
      .getRepository(AgentCategory)
      .save({ agentId: agent.id, name: "deprecated" })
    await setup.getRepository(AgentCategory).softDelete(deprecatedCategory.id)

    const uncategorizedSession = conversationAgentSessionFactory
      .transient({ organization, project, agent, user })
      .build({
        createdAt: new Date(dayStart.getTime() + 1 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
    const billingSession = conversationAgentSessionFactory
      .transient({ organization, project, agent, user })
      .build({
        createdAt: new Date(dayStart.getTime() + 2 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
    const multiCategorySession = conversationAgentSessionFactory
      .transient({ organization, project, agent, user })
      .build({
        createdAt: new Date(dayStart.getTime() + 3 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
    const deletedOnlySession = conversationAgentSessionFactory
      .transient({ organization, project, agent, user })
      .build({
        createdAt: new Date(dayStart.getTime() + 4 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })

    await repositories.conversationAgentSessionRepository.save([
      uncategorizedSession,
      billingSession,
      multiCategorySession,
      deletedOnlySession,
    ])

    await setup.getRepository(ConversationAgentSessionCategory).save([
      { conversationAgentSessionId: billingSession.id, agentCategoryId: billingCategory.id },
      { conversationAgentSessionId: multiCategorySession.id, agentCategoryId: billingCategory.id },
      { conversationAgentSessionId: multiCategorySession.id, agentCategoryId: supportCategory.id },
      { conversationAgentSessionId: deletedOnlySession.id, agentCategoryId: deprecatedCategory.id },
    ])
  }

  const subject = async () =>
    request({
      route: AgentAnalyticsRoutes.getConversationsByCategory,
      pathParams: removeNullish({ organizationId, projectId, agentId }),
      token: accessToken,
      query: {
        startAt: String(dayStart.getTime()),
        endAt: String(dayEnd.getTime()),
      },
    })

  it("returns category counts and uncategorized sessions", async () => {
    await createContext()

    const response = await subject()

    expectResponse(response, 200)
    expect(response.body.data).toEqual([
      {
        categoryName: "billing",
        value: 2,
        isUncategorized: false,
        categoryId: expect.any(String),
      },
      {
        categoryName: "uncategorized",
        value: 2,
        isUncategorized: true,
      },
      {
        categoryName: "support",
        value: 1,
        isUncategorized: false,
        categoryId: expect.any(String),
      },
    ])
  })
})
