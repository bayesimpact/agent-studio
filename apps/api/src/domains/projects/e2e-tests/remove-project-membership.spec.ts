import { ProjectsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { userFactory } from "@/domains/users/user.factory"
import { setupUserGuardForTesting } from "../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../test/request"
import { projectMembershipFactory } from "../project-membership.factory"
import { ProjectsModule } from "../projects.module"

describe("Projects - removeProjectMembership", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let organizationId: string
  let projectId: string
  let membershipId: string
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
    const { user, organization, project } = await createOrganizationWithProject(repositories)
    organizationId = organization.id
    projectId = project.id
    auth0Id = user.auth0Id

    // Create an invited user and membership
    const invitedUser = userFactory.build({ email: "invited@example.com" })
    await repositories.userRepository.save(invitedUser)

    const membership = projectMembershipFactory.transient({ project, user: invitedUser }).build()
    await repositories.projectMembershipRepository.save(membership)
    membershipId = membership.id

    return { organization, project, user, invitedUser, membership }
  }

  const subject = async () =>
    request({
      route: ProjectsRoutes.removeProjectMembership,
      pathParams: removeNullish({ organizationId, projectId, membershipId }),
      token: accessToken,
    })

  it("should successfully remove a membership", async () => {
    await createContext()

    const response = await subject()

    expectResponse(response, 200)
    expect(response.body).toEqual({ data: { success: true } })

    // Verify the membership is actually deleted from the database
    const deletedMembership = await repositories.projectMembershipRepository.findOne({
      where: { id: membershipId },
    })
    expect(deletedMembership).toBeNull()
  })
})
