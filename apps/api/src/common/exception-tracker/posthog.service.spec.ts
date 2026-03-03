import { PosthogService } from "./posthog.service"

const captureExceptionImmediateMock = jest.fn()

jest.mock("posthog-node", () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    captureExceptionImmediate: captureExceptionImmediateMock,
    shutdown: jest.fn(),
  })),
}))

describe("PosthogService", () => {
  const originalEnvironment = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnvironment }
    delete process.env.POSTHOG_KEY
    delete process.env.POSTHOG_API_KEY
    delete process.env.POSTHOG_HOST
  })

  afterAll(() => {
    process.env = originalEnvironment
  })

  it("does not initialize client when key is missing", () => {
    const service = new PosthogService()
    service.onModuleInit()

    service.captureException(new Error("test-error"))

    expect(captureExceptionImmediateMock).not.toHaveBeenCalled()
  })

  it("captures exception immediately with user context", async () => {
    process.env.POSTHOG_KEY = "phc_test_key"
    process.env.POSTHOG_HOST = "https://eu.i.posthog.com"
    captureExceptionImmediateMock.mockResolvedValue(undefined)

    const service = new PosthogService()
    service.onModuleInit()

    service.captureException(new Error("boom"), {
      userId: "user-123",
      path: "/api/test",
      method: "GET",
      statusCode: 500,
    })

    await Promise.resolve()

    expect(captureExceptionImmediateMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: "boom" }),
      "user-123",
      expect.objectContaining({
        path: "/api/test",
        method: "GET",
        statusCode: 500,
      }),
    )
  })
})
