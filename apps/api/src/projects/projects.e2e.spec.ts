import { ProjectsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import { createOrganizationWithOwner } from "@/organizations/organization.factory"
import { UserMembership } from "@/organizations/user-membership.entity"
import { User } from "@/users/user.entity"
import { setupUserGuardForTesting } from "../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../test/request"
import { ProjectsModule } from "./projects.module"

describe("ProjectsController (e2e)", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: {
    userRepository: Repository<User>
    organizationRepository: Repository<Organization>
    membershipRepository: Repository<UserMembership>
  }
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      featureEntities: [User, Organization, UserMembership],
      additionalImports: [ProjectsModule],
      applyOverrides: (moduleBuilder) => setupUserGuardForTesting(moduleBuilder, () => auth0Id),
    })
    repositories = {
      userRepository: setup.getRepository(User),
      organizationRepository: setup.getRepository(Organization),
      membershipRepository: setup.getRepository(UserMembership),
    }
    app = setup.module.createNestApplication()
    await app.init()
    request = testRequester(app)
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    app.close()
  })

  describe("ProjectsRoutes.listProjects", () => {
    const subject = async (organizationId?: string, token: string | null = "token") => {
      return request({
        route: ProjectsRoutes.listProjects,
        pathParams: organizationId ? { organizationId } : {},
        token: token ?? undefined,
      })
    }
    it("requires an authentication token", async () => {
      expectResponse(await subject("random-id", null), 401, "No access token provided")
    })
    it("requires a valid organization ID", async () => {
      expectResponse(await subject(undefined), 400, "Organization ID is required")
    })
    it("requires the user to be a member of the organization", async () => {
      const { organization } = await createOrganizationWithOwner(repositories)
      auth0Id = "another-auth0-id" // this will trigger a new user to be created in the database

      expectResponse(
        await subject(organization.id),
        401,
        "User is not a member of the organization",
      )
    })
    it("allows the owner to list projects", async () => {
      const { user, organization } = await createOrganizationWithOwner(repositories)
      auth0Id = user.auth0Id

      expectResponse(await subject(organization.id), 200)
    })
    it("allows the admin to list projects", async () => {
      const { user, organization } = await createOrganizationWithOwner(repositories, {
        membership: { role: "admin" },
      })
      auth0Id = user.auth0Id

      expectResponse(await subject(organization.id), 200)
    })
    it("allows the member to list projects", async () => {
      const { user, organization } = await createOrganizationWithOwner(repositories, {
        membership: { role: "member" },
      })
      auth0Id = user.auth0Id

      expectResponse(await subject(organization.id), 200)
    })
  })
})
