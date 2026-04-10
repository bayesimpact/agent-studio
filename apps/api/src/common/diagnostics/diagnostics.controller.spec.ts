import type { INestApplication } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import request from "supertest"
import type { App } from "supertest/types"
import { DiagnosticsModule } from "./diagnostics.module"

async function createApp(): Promise<INestApplication<App>> {
  const module = await Test.createTestingModule({
    imports: [DiagnosticsModule],
  }).compile()
  const app = module.createNestApplication()
  await app.init()
  return app
}

describe("DiagnosticsController", () => {
  describe("GET /diagnostics/:secret/test-error", () => {
    it("returns 404 when DIAGNOSTICS_SECRET is not set", async () => {
      delete process.env.DIAGNOSTICS_SECRET
      const app = await createApp()
      const response = await request(app.getHttpServer()).get("/diagnostics/any-value/test-error")
      expect(response.status).toBe(404)
      await app.close()
    })

    it("returns 404 when secret does not match", async () => {
      process.env.DIAGNOSTICS_SECRET = "correct-secret"
      const app = await createApp()
      const response = await request(app.getHttpServer()).get(
        "/diagnostics/wrong-secret/test-error",
      )
      expect(response.status).toBe(404)
      await app.close()
    })

    it("returns 500 when secret matches", async () => {
      process.env.DIAGNOSTICS_SECRET = "correct-secret"
      const app = await createApp()
      const response = await request(app.getHttpServer()).get(
        "/diagnostics/correct-secret/test-error",
      )
      expect(response.status).toBe(500)
      await app.close()
    })
  })
})
