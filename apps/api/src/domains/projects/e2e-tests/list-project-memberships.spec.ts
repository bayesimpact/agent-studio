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
import { projectFactory } from "@/domains/projects/project.factory"
import { userFactory } from "@/domains/users/user.factory"
import { setupUserGuardForTesting } from "../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../test/request"
import { projectMembershipFactory } from "../project-membership.factory"
import { ProjectsModule } from "../projects.module"

describe("Projects - listProjectMemberships", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let organizationId: string
  let projectId: string
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
    return { organization, project, user }
  }

  const subject = async () =>
    request({
      route: ProjectsRoutes.listProjectMemberships,
      pathParams: removeNullish({ organizationId, projectId }),
      token: accessToken,
    })

  it("should return empty list when no memberships exist", async () => {
    await createContext()

    const response = await subject()

    expectResponse(response, 200)
    expect(response.body.data.memberships).toEqual([])
  })

  it("should return memberships with user name and email", async () => {
    const { project } = await createContext()

    const invitedUser = userFactory.build({
      email: "invited@example.com",
      name: "Invited User",
    })
    await repositories.userRepository.save(invitedUser)

    const membership = projectMembershipFactory.transient({ project, user: invitedUser }).build()
    await repositories.projectMembershipRepository.save(membership)

    const response = await subject()

    expectResponse(response, 200)
    const { memberships } = response.body.data
    expect(memberships).toHaveLength(1)
    expect(memberships[0]!.userName).toBe("Invited User")
    expect(memberships[0]!.userEmail).toBe("invited@example.com")
    expect(memberships[0]!.status).toBe("sent")
    expect(memberships[0]!).toHaveProperty("id")
    expect(memberships[0]!).toHaveProperty("projectId")
    expect(memberships[0]!).toHaveProperty("userId")
    expect(memberships[0]!).toHaveProperty("createdAt")
  })

  it("should only return memberships for the specified project", async () => {
    const { organization, project } = await createContext()

    // Create another project in the same organization
    const otherProject = projectFactory.transient({ organization }).build()
    await repositories.projectRepository.save(otherProject)

    // Create users
    const user1 = userFactory.build({ email: "user1@example.com" })
    const user2 = userFactory.build({ email: "user2@example.com" })
    await repositories.userRepository.save([user1, user2])

    // Create membership in the target project
    const membership1 = projectMembershipFactory.transient({ project, user: user1 }).build()
    await repositories.projectMembershipRepository.save(membership1)

    // Create membership in the other project
    const membership2 = projectMembershipFactory
      .transient({ project: otherProject, user: user2 })
      .build()
    await repositories.projectMembershipRepository.save(membership2)

    const response = await subject()

    expectResponse(response, 200)
    const { memberships } = response.body.data
    expect(memberships).toHaveLength(1)
    expect(memberships[0]!.userEmail).toBe("user1@example.com")
  })
})
