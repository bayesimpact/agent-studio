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
import { setupUserGuardForTesting } from "../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../test/request"
import { Project } from "../project.entity"
import { ProjectsModule } from "../projects.module"

describe("Projects - createProject", () => {
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
    await app.close()
  })

  const createContext = async () => {
    const { user, organization } = await createOrganizationWithOwner(repositories)
    organizationId = organization.id
    auth0Id = user.auth0Id
    return { organization }
  }

  const subject = async (payload?: typeof ProjectsRoutes.createOne.request) =>
    request({
      route: ProjectsRoutes.createOne,
      pathParams: removeNullish({ organizationId }),
      token: accessToken,
      request: payload,
    })

  it("should create a project and return it", async () => {
    await createContext()

    const response = await subject({ payload: { name: "New Project" } })

    expectResponse(response, 201)
    expect(response.body.data.id).toBeDefined()
    expect(response.body.data.name).toBe("New Project")
    expect(response.body.data.organizationId).toBe(organizationId)

    const projectRepository = setup.getRepository(Project)
    const project = await projectRepository.findOne({
      where: { id: response.body.data.id },
    })
    expect(project).not.toBeNull()
    expect(project?.name).toBe("New Project")
  })
})
