import { Injectable, Logger, type OnModuleInit } from "@nestjs/common"
import { PostHog } from "posthog-node"
import type { ExceptionTrackerService } from "./types"

@Injectable()
export class PosthogService implements OnModuleInit, ExceptionTrackerService {
  private client: PostHog | undefined
  private readonly logger = new Logger(PosthogService.name)

  onModuleInit() {
    const posthogKey = process.env.POSTHOG_KEY ?? process.env.POSTHOG_API_KEY
    if (!posthogKey) {
      this.logger.log("PostHog disabled: missing POSTHOG_KEY/POSTHOG_API_KEY")
      return
    }

    const posthogHost = process.env.POSTHOG_HOST
    if (!posthogHost) {
      this.logger.warn("POSTHOG_HOST is not configured. Default host will be used by SDK.")
    }

    this.client = new PostHog(posthogKey, {
      host: posthogHost,
      enableExceptionAutocapture: true,
    })
    this.logger.log("PostHog exception tracking initialized")
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    if (!this.client) {
      return
    }

    const userId = typeof context?.userId === "string" ? context.userId : "anonymous"
    const properties = context && typeof context === "object" ? { ...context } : {}
    delete properties.userId

    this.logger.log(`Sending exception to PostHog for user ${userId}`)

    void this.client
      .captureExceptionImmediate(error, userId, properties)
      .then(() => {
        this.logger.log("Exception sent to PostHog successfully")
      })
      .catch((captureError) => {
        this.logger.error("Failed to send exception to PostHog", captureError)
      })
  }

  shutdown(): void {
    this.client?.shutdown()
  }
}
