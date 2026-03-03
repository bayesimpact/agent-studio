import { PosthogService } from "./posthog.service"

const captureExceptionMock = jest.fn()

jest.mock("posthog-node", () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    captureException: captureExceptionMock,
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

    expect(captureExceptionMock).not.toHaveBeenCalled()
  })

  it("captures exception immediately with user context", async () => {
    process.env.POSTHOG_KEY = "phc_test_key"
    process.env.POSTHOG_HOST = "https://eu.i.posthog.com"
    captureExceptionMock.mockResolvedValue(undefined)

    const service = new PosthogService()
    service.onModuleInit()

    service.captureException(new Error("boom"), {
      userId: "user-123",
      path: "/api/test",
      method: "GET",
      statusCode: 500,
    })

    await Promise.resolve()

    expect(captureExceptionMock).toHaveBeenCalledWith(
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
