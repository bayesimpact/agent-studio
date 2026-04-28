import { inspect } from "node:util"
import { type ArgumentsHost, Catch, Logger } from "@nestjs/common"
import { BaseExceptionFilter } from "@nestjs/core"

@Catch()
export class StackTraceLoggingExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(StackTraceLoggingExceptionFilter.name)

  override catch(exception: unknown, host: ArgumentsHost): void {
    const requestInfo = this.formatRequestInfo(host)
    if (exception instanceof Error) {
      this.logger.error(`${exception.message}${requestInfo}`, exception.stack)
    } else {
      this.logger.error(`Non-Error exception thrown: ${inspect(exception)}${requestInfo}`)
    }

    super.catch(exception, host)
  }

  private formatRequestInfo(host: ArgumentsHost): string {
    if (host.getType() !== "http") return ""
    const request = host.switchToHttp().getRequest<{ method?: string; url?: string }>()
    if (!request?.method || !request?.url) return ""
    return ` (${request.method} ${request.url})`
  }
}
