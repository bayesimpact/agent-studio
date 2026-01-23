import type { ApiRoute } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common/interfaces"
import request from "supertest"
import type { App } from "supertest/types"

// Helper function to make authenticated requests in tests
export const testRequester =
  (app: INestApplication<App>) =>
  async <T extends ApiRoute>(params: {
    route: T
    token?: string
    request?: T extends { method: "post" | "put" | "patch" } ? object : never
  }): Promise<Omit<request.Response, "body"> & { body: T["response"] }> => {
    const { token, route } = params
    const { method, getPath } = route

    const path = getPath()

    console.warn("AJ: method", method)
    console.warn("AJ: path", path)
    const req = request(app.getHttpServer())[method](path)

    // Attach request body for methods that support it
    if (method === "post" || method === "put" || method === "patch") {
      req.send(params.request)
    }

    // Add Authorization header if token is provided
    if (token) req.set("Authorization", `Bearer ${token}`)

    return (await req) as Omit<request.Response, "body"> & {
      body: T["response"]
    }
  }

export type Requester = ReturnType<typeof testRequester>
