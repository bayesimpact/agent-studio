import { randomUUID } from "node:crypto"
import { AnalyticsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import {
  type AllRepositories,
  clearTestDatabase,
  setupE2eTestDatabase,
  teardownE2eTestDatabase,
} from "@/common/test/test-database"
import { removeNullish } from "@/common/utils/remove-nullish"
import { agentFactory } from "@/domains/agents/agent.factory"
import { AgentCategory } from "@/domains/agents/categories/agent-category.entity"
import { conversationAgentSessionFactory } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.factory"
import { ConversationAgentSessionCategory } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session-category.entity"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import { ProjectsAnalyticsModule } from "../projects-analytics.module"

describe("Projects Analytics - getConversationsByCategory", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupE2eTestDatabase>>
  let repositories: AllRepositories

  let organizationId: string
  let projectId: string
  let primaryAgentId: string
  let accessToken: string | undefined = "token"
  let auth0Id = `auth0|${randomUUID()}`

  const dayStart = new Date("2026-01-01T00:00:00.000Z")
  const dayEnd = new Date("2026-01-01T23:59:59.999Z")

  beforeAll(async () => {
    setup = await setupE2eTestDatabase({
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
    auth0Id = `auth0|${randomUUID()}`
  })

  afterAll(async () => {
    await teardownE2eTestDatabase(setup)
    await app.close()
  })

  const createContext = async () => {
    const { organization, project, user } = await createOrganizationWithProject(repositories, {
      user: { auth0Id },
      projectMembership: { role: "admin" },
    })
    organizationId = organization.id
    projectId = project.id

    const primaryAgent = agentFactory.transient({ organization, project }).build()
    const secondaryAgent = agentFactory.transient({ organization, project }).build()
    await repositories.agentRepository.save([primaryAgent, secondaryAgent])
    primaryAgentId = primaryAgent.id

    const billingCategory = await setup
      .getRepository(AgentCategory)
      .save({ agentId: primaryAgent.id, name: "billing" })
    const supportCategory = await setup
      .getRepository(AgentCategory)
      .save({ agentId: primaryAgent.id, name: "support" })
    const secondaryCategory = await setup
      .getRepository(AgentCategory)
      .save({ agentId: secondaryAgent.id, name: "secondary" })

    const primaryUncategorized = conversationAgentSessionFactory
      .transient({ organization, project, agent: primaryAgent, user })
      .build({
        createdAt: new Date(dayStart.getTime() + 1 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
    const primaryBilling = conversationAgentSessionFactory
      .transient({ organization, project, agent: primaryAgent, user })
      .build({
        createdAt: new Date(dayStart.getTime() + 2 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
    const primaryMulti = conversationAgentSessionFactory
      .transient({ organization, project, agent: primaryAgent, user })
      .build({
        createdAt: new Date(dayStart.getTime() + 3 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
    const secondarySession = conversationAgentSessionFactory
      .transient({ organization, project, agent: secondaryAgent, user })
      .build({
        createdAt: new Date(dayStart.getTime() + 4 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
    await repositories.conversationAgentSessionRepository.save([
      primaryUncategorized,
      primaryBilling,
      primaryMulti,
      secondarySession,
    ])

    await setup.getRepository(ConversationAgentSessionCategory).save([
      { conversationAgentSessionId: primaryBilling.id, agentCategoryId: billingCategory.id },
      { conversationAgentSessionId: primaryMulti.id, agentCategoryId: billingCategory.id },
      { conversationAgentSessionId: primaryMulti.id, agentCategoryId: supportCategory.id },
      { conversationAgentSessionId: secondarySession.id, agentCategoryId: secondaryCategory.id },
    ])
  }

  const subject = async (agentId: string) =>
    request({
      route: AnalyticsRoutes.getConversationsByCategory,
      pathParams: removeNullish({ organizationId, projectId }),
      token: accessToken,
      query: {
        startAt: String(dayStart.getTime()),
        endAt: String(dayEnd.getTime()),
        agentId,
      },
    })

  it("returns category counts for the selected agent", async () => {
    await createContext()

    const response = await subject(primaryAgentId)

    expectResponse(response, 200)
    expect(response.body.data).toEqual([
      {
        categoryName: "billing",
        value: 2,
        isUncategorized: false,
        categoryId: expect.any(String),
      },
      {
        categoryName: "support",
        value: 1,
        isUncategorized: false,
        categoryId: expect.any(String),
      },
      {
        categoryName: "uncategorized",
        value: 1,
        isUncategorized: true,
      },
    ])
  })
})
