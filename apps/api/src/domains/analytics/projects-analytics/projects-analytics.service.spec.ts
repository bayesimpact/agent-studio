import { days, endOfUtcDay, hours, minutes } from "@/common/test/date-helpers"
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
    const day2Start = days(1).after(day1Start)
    const day3Start = days(2).after(day1Start)
    const day3End = endOfUtcDay(day3Start)

    const { organization, project, user } = await createOrganizationWithProject(repositories)

    const agent = agentFactory.transient({ organization, project }).build()
    await repositories.agentRepository.save(agent)

    const session1Day1 = conversationAgentSessionFactory
      .transient({ organization, project, agent, user })
      .build({ createdAt: hours(1).after(day1Start), updatedAt: new Date() })
    const session2Day1 = conversationAgentSessionFactory
      .transient({ organization, project, agent, user })
      .build({ createdAt: hours(2).after(day1Start), updatedAt: new Date() })
    const session3Day2 = conversationAgentSessionFactory
      .transient({ organization, project, agent, user })
      .build({ createdAt: hours(1).after(day2Start), updatedAt: new Date() })

    await repositories.conversationAgentSessionRepository.save([
      session1Day1,
      session2Day1,
      session3Day2,
    ])

    const userMessagesSession1 = [
      agentMessageFactory
        .user()
        .transient({ organization, project, session: session1Day1 })
        .build({ createdAt: minutes(10).after(day1Start) }),
      agentMessageFactory
        .user()
        .transient({ organization, project, session: session1Day1 })
        .build({ createdAt: minutes(20).after(day1Start) }),
    ]

    const userMessagesSession3 = Array.from({ length: 4 }, (_unusedValue, messageIndex) =>
      agentMessageFactory
        .user()
        .transient({ organization, project, session: session3Day2 })
        .build({
          createdAt: minutes((messageIndex + 1) * 5).after(day2Start),
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

  it("getConversationsPerDay should not leak data from other projects", async () => {
    const dayStart = new Date("2026-02-01T00:00:00.000Z")
    const dayEnd = endOfUtcDay(dayStart)

    const {
      organization: targetOrganization,
      project: targetProject,
      user: targetUser,
    } = await createOrganizationWithProject(repositories)
    const {
      organization: otherOrganization,
      project: otherProject,
      user: otherUser,
    } = await createOrganizationWithProject(repositories)

    const otherAgent = agentFactory
      .transient({ organization: otherOrganization, project: otherProject })
      .build()
    await repositories.agentRepository.save(otherAgent)

    const leakedSession = conversationAgentSessionFactory
      .transient({
        organization: otherOrganization,
        project: otherProject,
        agent: otherAgent,
        user: otherUser,
      })
      .build({ createdAt: hours(1).after(dayStart), updatedAt: new Date() })
    await repositories.conversationAgentSessionRepository.save(leakedSession)

    const targetConnectScope = {
      organizationId: targetOrganization.id,
      projectId: targetProject.id,
      userId: targetUser.id,
    }

    const conversations = await service.getConversationsPerDay({
      connectScope: targetConnectScope,
      startAt: dayStart.getTime(),
      endAt: dayEnd.getTime(),
    })

    expect(conversations).toEqual([{ date: dayStart.toISOString().slice(0, 10), value: 0 }])
  })

  it("getAvgUserQuestionsPerSessionPerDay should not leak data from other projects", async () => {
    const dayStart = new Date("2026-03-01T00:00:00.000Z")
    const dayEnd = endOfUtcDay(dayStart)

    const {
      organization: targetOrganization,
      project: targetProject,
      user: targetUser,
    } = await createOrganizationWithProject(repositories)
    const {
      organization: otherOrganization,
      project: otherProject,
      user: otherUser,
    } = await createOrganizationWithProject(repositories)

    const otherAgent = agentFactory
      .transient({ organization: otherOrganization, project: otherProject })
      .build()
    await repositories.agentRepository.save(otherAgent)

    const leakedSession = conversationAgentSessionFactory
      .transient({
        organization: otherOrganization,
        project: otherProject,
        agent: otherAgent,
        user: otherUser,
      })
      .build({ createdAt: hours(1).after(dayStart), updatedAt: new Date() })
    await repositories.conversationAgentSessionRepository.save(leakedSession)

    const leakedUserMessages = Array.from({ length: 3 }, (_unusedValue, messageIndex) =>
      agentMessageFactory
        .user()
        .transient({
          organization: otherOrganization,
          project: otherProject,
          session: leakedSession,
        })
        .build({
          createdAt: minutes((messageIndex + 1) * 5).after(dayStart),
        }),
    )
    await repositories.agentMessageRepository.save(leakedUserMessages)

    const targetConnectScope = {
      organizationId: targetOrganization.id,
      projectId: targetProject.id,
      userId: targetUser.id,
    }

    const averages = await service.getAvgUserQuestionsPerSessionPerDay({
      connectScope: targetConnectScope,
      startAt: dayStart.getTime(),
      endAt: dayEnd.getTime(),
    })

    expect(averages).toEqual([{ date: dayStart.toISOString().slice(0, 10), value: 0 }])
  })
})
