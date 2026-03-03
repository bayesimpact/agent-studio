import type { NextFunction, Request, Response } from "express"
import { RequestLoggerMiddleware } from "./request-logger.middleware"

describe("RequestLoggerMiddleware", () => {
  const createResponseMock = (statusCode: number) => {
    let finishHandler: (() => void) | undefined

    const response = {
      statusCode,
      on: jest.fn((eventName: string, handler: () => void) => {
        if (eventName === "finish") {
          finishHandler = handler
        }
        return response
      }),
    } as unknown as Response

    return {
      response,
      emitFinish: () => {
        finishHandler?.()
      },
    }
  }

  it("captures fallback exception for untracked 500 responses", () => {
    const trackerService = {
      captureException: jest.fn(),
      shutdown: jest.fn(),
    }

    const middleware = new RequestLoggerMiddleware(trackerService)
    const request = {
      method: "GET",
      originalUrl: "/test",
      body: {},
      query: {},
    } as unknown as Request
    const { response, emitFinish } = createResponseMock(500)
    const nextFunction: NextFunction = jest.fn()

    middleware.use(request, response, nextFunction)
    emitFinish()

    expect(nextFunction).toHaveBeenCalled()
    expect(trackerService.captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "HTTP 500 response without tracked exception",
      }),
      expect.objectContaining({
        statusCode: 500,
        path: "/test",
        method: "GET",
        source: "request-logger-fallback",
      }),
    )
  })

  it("does not capture fallback exception when filter already tracked request", () => {
    const trackerService = {
      captureException: jest.fn(),
      shutdown: jest.fn(),
    }

    const middleware = new RequestLoggerMiddleware(trackerService)
    const request = {
      method: "GET",
      originalUrl: "/test",
      body: {},
      query: {},
      exceptionTrackedByFilter: true,
    } as unknown as Request
    const { response, emitFinish } = createResponseMock(500)
    const nextFunction: NextFunction = jest.fn()

    middleware.use(request, response, nextFunction)
    emitFinish()

    expect(nextFunction).toHaveBeenCalled()
    expect(trackerService.captureException).not.toHaveBeenCalled()
  })
})
