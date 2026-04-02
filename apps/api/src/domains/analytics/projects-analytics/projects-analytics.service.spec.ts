import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { agentFactory } from "@/domains/agents/agent.factory"
import { conversationAgentSessionFactory } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.factory"
import { agentMessageFactory } from "@/domains/agents/shared/agent-session-messages/agent-messages.factory"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { ProjectsAnalyticsModule } from "./projects-analytics.module"
import { ProjectsAnalyticsService } from "./projects-analytics.service"

describe("ProjectsAnalyticsService", () => {
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories
  let service: ProjectsAnalyticsService

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [ProjectsAnalyticsModule],
    })
    repositories = setup.getAllRepositories()
    await clearTestDatabase(setup.dataSource)
    service = setup.module.get<ProjectsAnalyticsService>(ProjectsAnalyticsService)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
  })

  it("returns conversations per day and avg user questions per session per day", async () => {
    const day1Start = new Date("2026-01-01T00:00:00.000Z")
    const day2Start = new Date("2026-01-02T00:00:00.000Z")
    const day3Start = new Date("2026-01-03T00:00:00.000Z")
    const day3End = new Date(day3Start.getTime() + 24 * 60 * 60 * 1000 - 1)

    const { organization, project, user } = await createOrganizationWithProject(repositories)

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

    const userMessagesSession1 = [
      agentMessageFactory
        .user()
        .transient({ organization, project, session: session1Day1 })
        .build({ createdAt: new Date(day1Start.getTime() + 10 * 60 * 1000) }),
      agentMessageFactory
        .user()
        .transient({ organization, project, session: session1Day1 })
        .build({ createdAt: new Date(day1Start.getTime() + 20 * 60 * 1000) }),
    ]

    const userMessagesSession3 = Array.from({ length: 4 }, (_unusedValue, messageIndex) =>
      agentMessageFactory
        .user()
        .transient({ organization, project, session: session3Day2 })
        .build({
          createdAt: new Date(day2Start.getTime() + (messageIndex + 1) * 5 * 60 * 1000),
        }),
    )

    await repositories.agentMessageRepository.save([
      ...userMessagesSession1,
      ...userMessagesSession3,
    ])

    const connectScope = { organizationId: organization.id, projectId: project.id, userId: user.id }

    const conversations = await service.getConversationsPerDay({
      connectScope,
      startAt: day1Start.getTime(),
      endAt: day3End.getTime(),
    })

    expect(conversations).toEqual([
      { date: day1Start.toISOString().slice(0, 10), value: 2 },
      { date: day2Start.toISOString().slice(0, 10), value: 1 },
      { date: day3Start.toISOString().slice(0, 10), value: 0 },
    ])

    const averages = await service.getAvgUserQuestionsPerSessionPerDay({
      connectScope,
      startAt: day1Start.getTime(),
      endAt: day3End.getTime(),
    })

    expect(averages).toEqual([
      { date: day1Start.toISOString().slice(0, 10), value: 1 },
      { date: day2Start.toISOString().slice(0, 10), value: 4 },
      { date: day3Start.toISOString().slice(0, 10), value: 0 },
    ])
  })
})
