export interface ExceptionTrackerService {
  captureException(error: Error, context?: Record<string, unknown>): void
  shutdown(): void
}

export const EXCEPTION_TRACKER_SERVICE = "EXCEPTION_TRACKER_SERVICE"
