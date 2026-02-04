import { randomUUID } from "node:crypto"
import { ProjectsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { Organization } from "@/organizations/organization.entity"
import { createOrganizationWithProject } from "@/organizations/organization.factory"
import { UserMembership } from "@/organizations/user-membership.entity"
import { User } from "@/users/user.entity"
import { setupUserGuardForTesting } from "../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../test/request"
import { ProjectsModule } from "./projects.module"

describe("ProjectsController (e2e)", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  // Variables for the tests
  let organizationId: string | null = "random-organization-id"
  let projectId: string | null = "random-project-id"
  let accessToken: string | null = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      featureEntities: [User, Organization, UserMembership],
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
    organizationId = "random-organization-id"
    projectId = "random-project-id"
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
      auth0Id = "another-auth0-id" // this will trigger a new user to be created in the database
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
    it("allows the member to list projects", async () => {
      await createContextForRole("member")
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
      auth0Id = "another-auth0-id" // this will trigger a new user to be created in the database
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("doesn't allow a simple member to create projects", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
    it("allows the owner to create projects", async () => {
      await createContextForRole("owner")
      expectResponse(await subject({ payload: { name: "Test Project" } }), 201)
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
      auth0Id = "another-auth0-id" // this will trigger a new user to be created in the database
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("requires an existing project ID", async () => {
      await createContextForRole("owner")
      // Use a valid UUID format that doesn't exist in the database
      projectId = randomUUID()
      expectResponse(await subject(), 404)
    })
    it("doesn't allow a simple member to delete projects", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
    it("allows the owner to delete projects", async () => {
      await createContextForRole()
      expectResponse(await subject(), 200)
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
      auth0Id = "another-auth0-id" // this will trigger a new user to be created in the database
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("requires an existing project ID", async () => {
      await createContextForRole("owner")
      // Use a valid UUID format that doesn't exist in the database
      projectId = randomUUID()
      expectResponse(await subject(), 404)
    })
    it("doesn't allow a simple member to update a project", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
    it("allows the owner to update the project name", async () => {
      await createContextForRole()
      expectResponse(await subject({ payload: { name: "Updated Project" } }), 200)
    })
  })
})
