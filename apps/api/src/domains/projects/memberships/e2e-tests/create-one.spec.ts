import { ProjectMembershipRoutes } from "@caseai-connect/api-contracts"
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
import { mockInvitationSender, setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import { ProjectsModule } from "../../projects.module"

describe("Project membership - createOne", () => {
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
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    await app.close()
  })

  const createContext = async () => {
    const { user, organization, project } = await createOrganizationWithProject(repositories)
    organizationId = organization.id
    projectId = project.id
    auth0Id = user.auth0Id
    return { organization, project, user }
  }

  const subject = async (payload?: typeof ProjectMembershipRoutes.createOne.request) =>
    request({
      route: ProjectMembershipRoutes.createOne,
      pathParams: removeNullish({ organizationId, projectId }),
      token: accessToken,
      request: payload,
    })

  it("should invite a new user (creates user + membership)", async () => {
    await createContext()

    const response = await subject({ payload: { emails: ["newuser@example.com"] } })

    expectResponse(response, 201)
    const memberships = response.body.data
    expect(memberships).toHaveLength(1)
    expect(memberships[0]!.userEmail).toBe("newuser@example.com")
    expect(memberships[0]!.status).toBe("sent")
    expect(memberships[0]!.userName).toBeNull()

    // Verify user was created in the database
    const createdUser = await repositories.userRepository.findOne({
      where: { email: "newuser@example.com" },
    })
    expect(createdUser).toBeDefined()
    expect(createdUser!.auth0Id).toMatch(/^00000000-0000-0000-0000-/)
  })

  it("should invite an existing user (creates membership only)", async () => {
    await createContext()

    const existingUser = userFactory.build({
      email: "existing@example.com",
      name: "Existing User",
    })
    await repositories.userRepository.save(existingUser)

    const response = await subject({ payload: { emails: ["existing@example.com"] } })

    expectResponse(response, 201)
    const memberships = response.body.data
    expect(memberships).toHaveLength(1)
    expect(memberships[0]!.userEmail).toBe("existing@example.com")
    expect(memberships[0]!.userName).toBe("Existing User")
    expect(memberships[0]!.userId).toBe(existingUser.id)
  })

  it("should call the invitation sender for each invited user", async () => {
    await createContext()

    await subject({ payload: { emails: ["user1@example.com", "user2@example.com"] } })

    expect(mockInvitationSender.sendInvitation).toHaveBeenCalledTimes(2)
    expect(mockInvitationSender.sendInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        inviteeEmail: "user1@example.com",
        inviterName: expect.any(String),
      }),
    )
    expect(mockInvitationSender.sendInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        inviteeEmail: "user2@example.com",
        inviterName: expect.any(String),
      }),
    )
  })
})
