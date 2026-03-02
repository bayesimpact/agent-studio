import { MeRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Auth0UserInfoService } from "@/domains/auth/auth0-userinfo.service"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { OrganizationsService } from "@/domains/organizations/organizations.service"
import { type Requester, testRequester } from "../../../test/request"
import { MeModule } from "./me.module"

const mockOrganization = {
  id: "org-123",
  name: "Test Org",
}

const mockOrganizationsWithMemberships = [
  {
    organization: mockOrganization,
    role: "member",
  },
]

const mockAuth0UserInfoService = {
  getUserInfo: jest.fn().mockResolvedValue({
    sub: "auth0|123",
    email: "test@example.com",
    name: "Test User",
    picture: "http://picture.url",
  }),
}

const mockOrganizationsService = {
  getUserOrganizationsWithMemberships: jest
    .fn()
    .mockResolvedValue(mockOrganizationsWithMemberships),
}

describe("MeController (e2e)", () => {
  describe("MeRoutes.getMe", () => {
    describe("Unauthorized", () => {
      let app: INestApplication<App>
      let request: Requester
      let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>

      beforeAll(async () => {
        setup = await setupTransactionalTestDatabase({
          additionalImports: [MeModule],
        })
        app = setup.module.createNestApplication()
        await app.init()
        request = testRequester(app)
        await clearTestDatabase(setup.dataSource)
      })

      afterAll(async () => {
        await teardownTestDatabase(setup)
      })

      it("401 without token", async () => {
        const res = await request({ route: MeRoutes.getMe })
        expect(res.status).toBe(401)
      })
    })

    describe("Authorized", () => {
      let app: INestApplication<App>
      let request: Requester
      let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>

      beforeAll(async () => {
        setup = await setupTransactionalTestDatabase({
          additionalImports: [MeModule],
          applyOverrides: (moduleBuilder) =>
            moduleBuilder
              .overrideGuard(JwtAuthGuard)
              .useValue({
                // biome-ignore lint/suspicious/noExplicitAny: for test only
                canActivate: (context: any) => {
                  const request = context.switchToHttp().getRequest()
                  request.user = { sub: "auth0|123" }
                  return true
                },
              })
              .overrideProvider(Auth0UserInfoService)
              .useValue(mockAuth0UserInfoService)
              .overrideProvider(OrganizationsService)
              .useValue(mockOrganizationsService),
        })
        app = setup.module.createNestApplication()
        await app.init()
        request = testRequester(app)
        await clearTestDatabase(setup.dataSource)
      })

      afterAll(async () => {
        await teardownTestDatabase(setup)
      })

      it("200 with valid token and returns user info and organizations", async () => {
        const res = await request({ route: MeRoutes.getMe, token: "mocked-token" })
        expect(res.status).toBe(200)

        expect(mockAuth0UserInfoService.getUserInfo).toHaveBeenCalledWith("mocked-token")

        expect(res.body.data).toEqual({
          user: {
            id: expect.any(String),
            email: "test@example.com",
            name: "Test User",
          },
          organizations: [
            {
              id: mockOrganization.id,
              name: mockOrganization.name,
              role: "member",
              featureFlags: [],
            },
          ],
        })
      })
    })
  })
})
