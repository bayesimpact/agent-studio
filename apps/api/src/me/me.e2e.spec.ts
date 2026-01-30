import { MeRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import type { App } from "supertest/types"
import { type Requester, testRequester } from "../../test/request"
import { AppModule } from "../app.module"
import { Auth0UserInfoService } from "../auth/auth0-userinfo.service"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { OrganizationsService } from "../organizations/organizations.service"

// Mock Langfuse to avoid dynamic import issues in Jest
jest.mock("langfuse", () => {
  return {
    Langfuse: class {
      shutdownAsync() {
        return Promise.resolve()
      }
      flushAsync() {
        return Promise.resolve()
      }
      trace() {
        return { update: jest.fn() }
      }
    },
  }
})

describe("MeController (e2e)", () => {
  let app: INestApplication<App>
  let request: Requester

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
  }

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

  describe("MeRoutes.getMe", () => {
    describe("Unauthorized", () => {
      beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
          imports: [AppModule],
        }).compile()

        app = moduleFixture.createNestApplication()
        await app.init()
        request = testRequester(app)
      })

      afterAll(async () => {
        await app.close()
      })

      it("401 without token", async () => {
        const res = await request({ route: MeRoutes.getMe })
        expect(res.status).toBe(401)
      })
    })

    describe("Authorized", () => {
      beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
          imports: [AppModule],
        })
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
          .useValue(mockOrganizationsService)
          .compile()

        app = moduleFixture.createNestApplication()
        await app.init()
        request = testRequester(app)
      })

      afterAll(async () => {
        await app.close()
      })

      it("200 with valid token and returns user info and organizations", async () => {
        const res = await request({ route: MeRoutes.getMe, token: "mocked-token" })
        expect(res.status).toBe(200)

        expect(mockAuth0UserInfoService.getUserInfo).toHaveBeenCalledWith("auth0|123")

        expect(res.body.data).toEqual({
          user: mockUser,
          organizations: [
            {
              id: mockOrganization.id,
              name: mockOrganization.name,
              role: "member",
            },
          ],
        })
      })
    })
  })
})
