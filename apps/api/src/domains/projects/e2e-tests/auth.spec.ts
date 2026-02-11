import { randomUUID } from "node:crypto"
import { ProjectsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { clearTestDatabase, RandomUuid } from "@/common/test/test-database"
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

describe("Projects - Auth", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  // Variables for the tests
  let organizationId: string | null = RandomUuid.Organization
  let projectId: string | null = RandomUuid.Project
  let accessToken: string | null = "token"
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
    organizationId = RandomUuid.Organization
    projectId = RandomUuid.Project
    accessToken = "token"
    auth0Id = "auth0|123"
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    app.close()
  })

  const createContextForRole = async (role: "owner" | "admin" | "member" = "owner") => {
    const { user, organization, project } = await createOrganizationWithProject(repositories, {
      membership: { role },
    })
    organizationId = organization.id
    projectId = project.id
    accessToken = "token"
    auth0Id = user.auth0Id
    return { organization, project }
  }

  describe("ProjectsRoutes.listProjects", () => {
    const subject = async () =>
      request({
        route: ProjectsRoutes.listProjects,
        pathParams: removeNullish({ organizationId }),
        token: accessToken ?? undefined,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("allows the owner to list projects", async () => {
      await createContextForRole("owner")
      expectResponse(await subject(), 200)
    })
    it("allows the admin to list projects", async () => {
      await createContextForRole("admin")
      expectResponse(await subject(), 200)
    })
  })

  describe("ProjectsRoutes.createProject", () => {
    const subject = async (payload?: typeof ProjectsRoutes.createProject.request) =>
      request({
        route: ProjectsRoutes.createProject,
        pathParams: removeNullish({ organizationId }),
        token: accessToken ?? undefined,
        request: payload,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("doesn't allow a simple member to create projects", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })

  describe("ProjectsRoutes.deleteProject", () => {
    const subject = async () =>
      request({
        route: ProjectsRoutes.deleteProject,
        pathParams: removeNullish({ organizationId, projectId }),
        token: accessToken ?? undefined,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires the user to belong to the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("requires an existing project ID", async () => {
      await createContextForRole("owner")
      projectId = randomUUID()
      expectResponse(await subject(), 404)
    })
    it("doesn't allow a simple member to delete projects", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })

  describe("ProjectsRoutes.updateProject", () => {
    const subject = async (payload?: typeof ProjectsRoutes.updateProject.request) =>
      request({
        route: ProjectsRoutes.updateProject,
        pathParams: removeNullish({ organizationId, projectId }),
        token: accessToken ?? undefined,
        request: payload,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("requires an existing project ID", async () => {
      await createContextForRole("owner")
      projectId = randomUUID()
      expectResponse(await subject(), 404)
    })
    it("doesn't allow a simple member to update a project", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })

  describe("ProjectsRoutes.listProjectMemberships", () => {
    const subject = async () =>
      request({
        route: ProjectsRoutes.listProjectMemberships,
        pathParams: removeNullish({ organizationId, projectId }),
        token: accessToken ?? undefined,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("requires an existing project ID", async () => {
      await createContextForRole("owner")
      projectId = randomUUID()
      expectResponse(await subject(), 404)
    })
    it("doesn't allow a simple member to list project memberships", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
    it("allows the owner to list project memberships", async () => {
      await createContextForRole("owner")
      expectResponse(await subject(), 200)
    })
    it("allows the admin to list project memberships", async () => {
      await createContextForRole("admin")
      expectResponse(await subject(), 200)
    })
  })

  describe("ProjectsRoutes.inviteProjectMembers", () => {
    const subject = async (payload?: typeof ProjectsRoutes.inviteProjectMembers.request) =>
      request({
        route: ProjectsRoutes.inviteProjectMembers,
        pathParams: removeNullish({ organizationId, projectId }),
        token: accessToken ?? undefined,
        request: payload,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("requires an existing project ID", async () => {
      await createContextForRole("owner")
      projectId = randomUUID()
      expectResponse(await subject(), 404)
    })
    it("doesn't allow a simple member to invite project members", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })

  describe("ProjectsRoutes.removeProjectMembership", () => {
    let membershipId: string | null = "random-membership-id"

    const subject = async () =>
      request({
        route: ProjectsRoutes.removeProjectMembership,
        pathParams: removeNullish({ organizationId, projectId, membershipId }),
        token: accessToken ?? undefined,
      })

    const createContextForRoleWithMembership = async (
      role: "owner" | "admin" | "member" = "owner",
    ) => {
      const { organization, project } = await createContextForRole(role)

      // Create an invited user and membership for the project
      const invitedUser = userFactory.build({ email: "invited@example.com" })
      await repositories.userRepository.save(invitedUser)

      const membership = projectMembershipFactory.transient({ project, user: invitedUser }).build()
      await repositories.projectMembershipRepository.save(membership)
      membershipId = membership.id

      return { organization, project, membership }
    }

    beforeEach(() => {
      membershipId = "random-membership-id"
    })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires the user to be a member of the organization", async () => {
      await createContextForRoleWithMembership("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("requires an existing project ID", async () => {
      await createContextForRoleWithMembership("owner")
      projectId = randomUUID()
      expectResponse(await subject(), 404)
    })
    it("requires an existing membership ID", async () => {
      await createContextForRoleWithMembership("owner")
      membershipId = randomUUID()
      expectResponse(await subject(), 404)
    })
    it("requires the membership to belong to the project", async () => {
      const { organization } = await createContextForRoleWithMembership("owner")

      // Create another project in the same organization
      const otherProject = projectFactory.transient({ organization }).build()
      await repositories.projectRepository.save(otherProject)
      projectId = otherProject.id

      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
    it("doesn't allow a simple member to remove project memberships", async () => {
      await createContextForRoleWithMembership("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })
})
