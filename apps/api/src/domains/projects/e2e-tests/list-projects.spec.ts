import { ProjectsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { createOrganizationWithOwner } from "@/domains/organizations/organization.factory"
import { projectFactory } from "@/domains/projects/project.factory"
import { setupUserGuardForTesting } from "../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../test/request"
import { ProjectsModule } from "../projects.module"

describe("Projects - listProjects", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let organizationId: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [ProjectsModule],
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
    app.close()
  })

  const createContext = async () => {
    const { user, organization } = await createOrganizationWithOwner(repositories)
    organizationId = organization.id
    auth0Id = user.auth0Id
    return { organization }
  }

  const subject = async () =>
    request({
      route: ProjectsRoutes.listProjects,
      pathParams: removeNullish({ organizationId }),
      token: accessToken,
    })

  it("should return projects for an organization", async () => {
    const { organization } = await createContext()

    const project1 = projectFactory.transient({ organization }).build({ name: "Project 1" })
    const project2 = projectFactory.transient({ organization }).build({ name: "Project 2" })
    await repositories.projectRepository.save([project1, project2])

    const response = await subject()

    expectResponse(response, 200)
    const { projects } = response.body.data
    expect(projects).toHaveLength(2)
    expect(projects.map((project) => project.name)).toContain("Project 1")
    expect(projects.map((project) => project.name)).toContain("Project 2")
    expect(projects[0]).toHaveProperty("id")
    expect(projects[0]).toHaveProperty("createdAt")
    expect(projects[0]).toHaveProperty("updatedAt")
  })

  it("should return empty array when organization has no projects", async () => {
    await createContext()

    const response = await subject()

    expectResponse(response, 200)
    expect(response.body.data.projects).toEqual([])
  })
})
