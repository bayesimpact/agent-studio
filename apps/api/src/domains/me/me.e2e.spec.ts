import { MeRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import {
  createOrganizationWithAgent,
  createOrganizationWithOwner,
} from "@/domains/organizations/organization.factory"
import { projectFactory } from "@/domains/projects/project.factory"
import { userFactory } from "@/domains/users/user.factory"
import { setupUserGuardForTesting } from "../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../test/request"
import { addUserToProject } from "../projects/memberships/project-membership.factory"
import { MeModule } from "./me.module"

describe("MeController (e2e)", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories

  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [MeModule],
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
    const { user, organization, organizationMembership } =
      await createOrganizationWithOwner(repositories)
    auth0Id = user.auth0Id
    return { user, organization, organizationMembership }
  }

  const subject = async () =>
    request({
      route: MeRoutes.getMe,
      token: accessToken,
    })

  describe("MeRoutes.getMe", () => {
    it("requires an authentication token", async () => {
      accessToken = undefined
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })

    it("returns user info with empty organizations when user has no orgs", async () => {
      const soloUser = userFactory.build()
      await repositories.userRepository.save(soloUser)
      auth0Id = soloUser.auth0Id

      const response = await subject()

      expectResponse(response, 200)
      expect(response.body.data.user).toMatchObject({
        id: soloUser.id,
        email: soloUser.email,
        name: soloUser.name,
        memberships: {
          organizationMemberships: [],
          projectMemberships: [],
          agentMemberships: [],
        },
      })
      expect(response.body.data.organizations).toEqual([])
    })

    it("returns user info with organization", async () => {
      const { user, organization } = await createContext()

      const response = await subject()

      expectResponse(response, 200)
      expect(response.body.data.user).toMatchObject({
        id: user.id,
        email: user.email,
        name: user.name,
      })
      expect(response.body.data.user.memberships.organizationMemberships).toHaveLength(1)
      expect(response.body.data.user.memberships.organizationMemberships[0]).toMatchObject({
        organizationId: organization.id,
        role: "owner",
      })
      expect(response.body.data.organizations).toHaveLength(1)
      expect(response.body.data.organizations[0]).toMatchObject({
        id: organization.id,
        name: organization.name,
        projects: [],
      })
    })

    it("returns organizations with their projects", async () => {
      const { user, organization } = await createContext()

      const project = projectFactory.transient({ organization }).build({ name: "Test Project" })
      await repositories.projectRepository.save(project)
      await addUserToProject({ repositories, project, user })

      const response = await subject()

      expectResponse(response, 200)
      expect(response.body.data.organizations).toHaveLength(1)
      expect(response.body.data.organizations[0].projects).toHaveLength(1)
      expect(response.body.data.organizations[0].projects[0]).toMatchObject({
        id: project.id,
        name: "Test Project",
        organizationId: organization.id,
      })
    })

    it("returns all membership types", async () => {
      const { user, organization, project, agent } = await createOrganizationWithAgent(repositories)
      auth0Id = user.auth0Id

      const response = await subject()

      expectResponse(response, 200)

      const { memberships } = response.body.data.user
      expect(memberships.organizationMemberships).toHaveLength(1)
      expect(memberships.organizationMemberships[0]).toMatchObject({
        organizationId: organization.id,
        role: "owner",
      })
      expect(memberships.projectMemberships).toHaveLength(1)
      expect(memberships.projectMemberships[0]).toMatchObject({
        projectId: project.id,
        role: "owner",
      })
      expect(memberships.agentMemberships).toHaveLength(1)
      expect(memberships.agentMemberships[0]).toMatchObject({
        agentId: agent.id,
        role: "owner",
      })
    })
  })
})
