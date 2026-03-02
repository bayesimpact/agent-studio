import { Injectable, type OnModuleInit } from "@nestjs/common"
import { PostHog } from "posthog-node"
import type { ExceptionTrackerService } from "./types"

@Injectable()
export class PosthogService implements OnModuleInit, ExceptionTrackerService {
  private client: PostHog | undefined

  onModuleInit() {
    const posthogKey = process.env.POSTHOG_KEY ?? process.env.POSTHOG_API_KEY
    if (!posthogKey) {
      return
    }

    this.client = new PostHog(posthogKey, {
      host: process.env.POSTHOG_HOST,
      enableExceptionAutocapture: true,
    })
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    if (!this.client) {
      return
    }

    const userId = typeof context?.userId === "string" ? context.userId : "anonymous"
    const properties = context && typeof context === "object" ? { ...context } : {}
    delete properties.userId

    this.client.captureException(error, userId, properties)
  }

  shutdown(): void {
    this.client?.shutdown()
  }
}
