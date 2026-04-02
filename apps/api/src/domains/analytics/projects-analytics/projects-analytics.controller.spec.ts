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
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { setupUserGuardForTesting } from "../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../test/request"
import { ProjectsAnalyticsModule } from "./projects-analytics.module"

describe("ProjectsAnalyticsController", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories

  let organizationId: string
  let projectId: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"

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
  }

  it("returns zero counts when no sessions exist", async () => {
    await createContext()

    const day1Start = new Date("2026-01-01T00:00:00.000Z")
    const day2Start = new Date("2026-01-02T00:00:00.000Z")

    const response = await request({
      route: AnalyticsRoutes.getConversationsPerDay,
      pathParams: removeNullish({ organizationId, projectId }),
      token: accessToken,
      request: {
        payload: {
          startAt: day1Start.getTime(),
          endAt: new Date(day2Start.getTime() + 24 * 60 * 60 * 1000 - 1).getTime(),
        },
      },
    })

    expectResponse(response, 200)
    expect(response.body.data).toEqual([
      { date: day1Start.toISOString().slice(0, 10), value: 0 },
      { date: day2Start.toISOString().slice(0, 10), value: 0 },
    ])
  })
})
