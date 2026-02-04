import type { ApiRoute, ErrorResponseDTO } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common/interfaces"
import request from "supertest"
import type { App } from "supertest/types"

// Helper function to make authenticated requests in tests
export const testRequester =
  (app: INestApplication<App>) =>
  async <T extends ApiRoute>(params: {
    route: T
    pathParams?: Record<string, string>
    token?: string
    request?: T["request"]
  }): Promise<Omit<request.Response, "body"> & { body: T["response"] }> => {
    const { token, route } = params
    const { method, getPath } = route

    const path = getPath(params.pathParams)

    const req = request(app.getHttpServer())[method](path)

    if (
      "request" in params &&
      params.request &&
      "payload" in params.request &&
      params.request.payload
    ) {
      req.send(params.request)
    }

    // Add Authorization header if token is provided
    if (token) req.set("Authorization", `Bearer ${token}`)

    return (await req) as Omit<request.Response, "body"> & {
      body: T["response"]
    }
  }

export type Requester = ReturnType<typeof testRequester>

export const expectErrorResponse = (res: request.Response, status: number, message: string) => {
  expect(res.status).toBe(status)
  const errorResponse = res.body as unknown as ErrorResponseDTO
  expect(errorResponse.message).toBe(message)
}

export const expectResponse = (
  res: request.Response,
  status: number = 200,
  errorMessage?: string,
) => {
  if (errorMessage) {
    expectErrorResponse(res, status, errorMessage)
    return
  }
  expect(res.status).toBe(status)
}
