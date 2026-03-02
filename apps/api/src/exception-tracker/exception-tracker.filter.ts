import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common"
import { BaseExceptionFilter } from "@nestjs/core"
import type { Request } from "express"
import { EXCEPTION_TRACKER_SERVICE, type ExceptionTrackerService } from "./types"

@Catch()
@Injectable()
export class ExceptionTrackerFilter extends BaseExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(EXCEPTION_TRACKER_SERVICE)
    private readonly trackerService: ExceptionTrackerService,
  ) {
    super()
  }

  override catch(exception: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<Request>()

    const error =
      exception instanceof Error ? exception : new Error(this.safeStringifyException(exception))

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const requestUser = request as Request & {
      user?: {
        id?: string
        auth0Id?: string
      }
      jwtPayload?: {
        sub?: string
      }
    }

    const userId =
      requestUser.user?.id ??
      requestUser.user?.auth0Id ??
      requestUser.jwtPayload?.sub ??
      "anonymous"

    this.trackerService.captureException(error, {
      userId,
      statusCode,
      path: request?.url,
      method: request?.method,
      ip: request?.ip,
      userAgent: request?.headers["user-agent"],
    })

    super.catch(exception, host)
  }

  private safeStringifyException(exception: unknown): string {
    try {
      return JSON.stringify(exception)
    } catch {
      return "Unknown exception"
    }
  }
}
