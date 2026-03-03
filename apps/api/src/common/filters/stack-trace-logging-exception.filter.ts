import { inspect } from "node:util"
import { type ArgumentsHost, Catch, Logger } from "@nestjs/common"
import { BaseExceptionFilter } from "@nestjs/core"

@Catch()
export class StackTraceLoggingExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(StackTraceLoggingExceptionFilter.name)

  override catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack)
    } else {
      this.logger.error(`Non-Error exception thrown: ${inspect(exception)}`)
    }

    super.catch(exception, host)
  }
}
