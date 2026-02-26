import { Injectable, type NestMiddleware } from "@nestjs/common"
import type { NextFunction, Request, Response } from "express"

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
    })

    next()
  }
}
