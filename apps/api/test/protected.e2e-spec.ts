import type { INestApplication } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import type { App } from "supertest/types"
import { AppModule } from "./../src/app.module"
import { JwtAuthGuard } from "./../src/auth/jwt-auth.guard"
import { ProtectedRoutes } from "../src/exports/api-routes/protected"
import { type Requester, testRequester } from "./request"

// NOTE: How to run this test:
// npx jest --config ./test/jest-e2e.json test/protected.e2e-spec.ts

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

describe("ProtectedController (e2e)", () => {
  let app: INestApplication<App>
  let request: Requester

  describe("ProtectedRoutes.getHello", () => {
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
        const res = await request({ route: ProtectedRoutes.getHello })
        expect(res.status).toBe(401)
      })
    })

    describe("Authorized", () => {
      beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
          imports: [AppModule],
        })
          .overrideGuard(JwtAuthGuard)
          .useValue({
            canActivate: (context) => {
              const request = context.switchToHttp().getRequest()
              request.user = { sub: "test-user-123" }
              return true
            },
          })
          .compile()

        app = moduleFixture.createNestApplication()
        await app.init()
        request = testRequester(app)
      })

      afterAll(async () => {
        await app.close()
      })

      it("200 with valid token (mocked)", async () => {
        const res = await request({ route: ProtectedRoutes.getHello, token: "mocked-token" })
        expect(res.status).toBe(200)
        expect(res.body.data).toBe("Protected api route accessed by user: test-user-123")
      })
    })
  })
})
