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

describe("Projects - inviteProjectMembers", () => {
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

  const subject = async (payload?: typeof ProjectsRoutes.inviteProjectMembers.request) =>
    request({
      route: ProjectsRoutes.inviteProjectMembers,
      pathParams: removeNullish({ organizationId, projectId }),
      token: accessToken,
      request: payload,
    })

  it("should invite a new user (creates user + membership)", async () => {
    await createContext()

    const response = await subject({ payload: { emails: ["newuser@example.com"] } })

    expectResponse(response, 201)
    const { memberships } = response.body.data
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
    const { memberships } = response.body.data
    expect(memberships).toHaveLength(1)
    expect(memberships[0]!.userEmail).toBe("existing@example.com")
    expect(memberships[0]!.userName).toBe("Existing User")
    expect(memberships[0]!.userId).toBe(existingUser.id)
  })

  it("should skip duplicate invitations (user already a member)", async () => {
    const { project } = await createContext()

    const existingUser = userFactory.build({ email: "already@example.com" })
    await repositories.userRepository.save(existingUser)

    const membership = projectMembershipFactory.transient({ project, user: existingUser }).build()
    await repositories.projectMembershipRepository.save(membership)

    const response = await subject({ payload: { emails: ["already@example.com"] } })

    expectResponse(response, 201)
    const { memberships } = response.body.data
    expect(memberships).toHaveLength(0)
  })

  it("should create memberships with status 'sent' and a valid invitationToken", async () => {
    await createContext()

    const response = await subject({ payload: { emails: ["token-test@example.com"] } })

    expectResponse(response, 201)

    // Verify in the database
    const savedMembership = await repositories.projectMembershipRepository.findOne({
      where: { projectId },
    })
    expect(savedMembership).toBeDefined()
    expect(savedMembership!.status).toBe("sent")
    expect(savedMembership!.invitationToken).toBeDefined()
    expect(savedMembership!.invitationToken.length).toBeGreaterThan(0)
  })

  it("should handle multiple emails in a single request", async () => {
    await createContext()

    const response = await subject({
      payload: { emails: ["multi1@example.com", "multi2@example.com", "multi3@example.com"] },
    })

    expectResponse(response, 201)
    const { memberships } = response.body.data
    expect(memberships).toHaveLength(3)
    expect(memberships.map((membership) => membership.userEmail)).toEqual(
      expect.arrayContaining(["multi1@example.com", "multi2@example.com", "multi3@example.com"]),
    )
  })
})
