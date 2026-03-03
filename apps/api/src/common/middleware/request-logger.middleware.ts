import { Inject, Injectable, type NestMiddleware } from "@nestjs/common"
import type { NextFunction, Request, Response } from "express"
import {
  EXCEPTION_TRACKER_SERVICE,
  type ExceptionTrackerService,
} from "../../exception-tracker/types"

/**
 * NestJS middleware that logs incoming requests and their responses.
 * Similar to Rails' default request logging.
 *
 * Must be registered via AppModule.configure() so it runs AFTER body parsing.
 *
 * Example output:
 *   --> POST /invitations/accept
 *       body: {"payload":{"ticketId":"ticket_abc"}}
 *   <-- POST /invitations/accept 201 45ms
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(EXCEPTION_TRACKER_SERVICE)
    private readonly exceptionTrackerService: ExceptionTrackerService,
  ) {}

  use(request: Request, response: Response, next: NextFunction) {
    const { method, originalUrl, body, query } = request
    const startTime = Date.now()

    // Build the log parts
    const parts = [`--> ${method} ${originalUrl} 📥`]

    if (Object.keys(query).length > 0) {
      parts.push(`    query: ${JSON.stringify(query)}`)
    }

    if (body && Object.keys(body).length > 0) {
      parts.push(`    body: ${JSON.stringify(body)}`)
    }

    console.log(parts.join("\n"))

    // Log response when finished
    response.on("finish", () => {
      const duration = Date.now() - startTime
      console.log(`<-- ${method} ${originalUrl} ${response.statusCode} ${duration}ms 📤`)

      const trackedRequest = request as Request & { exceptionTrackedByFilter?: boolean }
      const isServerErrorResponse = response.statusCode >= 500
      if (isServerErrorResponse && !trackedRequest.exceptionTrackedByFilter) {
        const requestWithUser = request as Request & {
          user?: {
            id?: string
            auth0Id?: string
          }
          jwtPayload?: {
            sub?: string
          }
        }
        const userId =
          requestWithUser.user?.id ??
          requestWithUser.user?.auth0Id ??
          requestWithUser.jwtPayload?.sub ??
          "anonymous"

        this.exceptionTrackerService.captureException(
          new Error(`HTTP ${response.statusCode} response without tracked exception`),
          {
            userId,
            statusCode: response.statusCode,
            path: originalUrl,
            method,
            source: "request-logger-fallback",
          },
        )
      }
    })

    next()
  }
}
