import type { LoggerService, LogLevel } from "@nestjs/common"
import { context, trace } from "@opentelemetry/api"

type GcpSeverity = "DEBUG" | "INFO" | "WARNING" | "ERROR"

interface StructuredLogEntry {
  severity: GcpSeverity
  message: string
  context?: string
  timestamp: string
  stack_trace?: string
  "logging.googleapis.com/trace"?: string
  "logging.googleapis.com/spanId"?: string
}

const LOG_LEVEL_TO_SEVERITY: Record<LogLevel, GcpSeverity> = {
  log: "INFO",
  error: "ERROR",
  warn: "WARNING",
  debug: "DEBUG",
  verbose: "DEBUG",
  fatal: "ERROR",
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  fatal: 0,
  error: 1,
  warn: 2,
  log: 3,
  debug: 4,
  verbose: 5,
}

/**
 * Returns NestJS log levels enabled by the LOG_LEVEL env var.
 * Defaults to "log" (error, warn, log). Set to "debug" or "verbose" for more output.
 */
export function getLogLevels(): LogLevel[] {
  const envLevel = (process.env.LOG_LEVEL ?? "log") as LogLevel
  const threshold = LOG_LEVEL_PRIORITY[envLevel] ?? LOG_LEVEL_PRIORITY.log
  return Object.entries(LOG_LEVEL_PRIORITY)
    .filter(([, priority]) => priority <= threshold)
    .map(([level]) => level as LogLevel)
}

function isStackTrace(value: unknown): value is string {
  return typeof value === "string" && value.includes("\n") && value.includes("    at ")
}

export class StructuredLogger implements LoggerService {
  private readonly isTest = process.env.NODE_ENV === "test"
  private readonly gcpProject = process.env.GOOGLE_CLOUD_PROJECT ?? ""
  private readonly enabledLevels: Set<LogLevel>

  constructor(logLevels?: LogLevel[]) {
    this.enabledLevels = new Set(logLevels ?? getLogLevels())
  }

  log(message: unknown, context?: string): void {
    this.writeLog("log", String(message), undefined, context)
  }

  error(message: unknown, stackOrContext?: string, context?: string): void {
    let stack: string | undefined
    let ctx: string | undefined

    if (context) {
      stack = stackOrContext
      ctx = context
    } else if (isStackTrace(stackOrContext)) {
      stack = stackOrContext
    } else {
      ctx = stackOrContext
    }

    this.writeLog("error", String(message), stack, ctx)
  }

  warn(message: unknown, context?: string): void {
    this.writeLog("warn", String(message), undefined, context)
  }

  debug(message: unknown, context?: string): void {
    this.writeLog("debug", String(message), undefined, context)
  }

  verbose(message: unknown, context?: string): void {
    this.writeLog("verbose", String(message), undefined, context)
  }

  fatal(message: unknown, context?: string): void {
    this.writeLog("fatal", String(message), undefined, context)
  }

  private writeLog(level: LogLevel, message: string, stack?: string, logContext?: string): void {
    if (this.isTest) return
    if (!this.enabledLevels.has(level)) return

    const entry: StructuredLogEntry = {
      severity: LOG_LEVEL_TO_SEVERITY[level],
      message,
      timestamp: new Date().toISOString(),
    }

    if (logContext) {
      entry.context = logContext
    }

    if (stack) {
      entry.stack_trace = stack
    }

    const spanContext = trace.getSpan(context.active())?.spanContext()
    if (spanContext) {
      entry["logging.googleapis.com/trace"] =
        `projects/${this.gcpProject}/traces/${spanContext.traceId}`
      entry["logging.googleapis.com/spanId"] = spanContext.spanId
    }

    process.stdout.write(`${JSON.stringify(entry)}\n`)
  }
}
