import { timingSafeEqual } from "node:crypto"
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common"
import type { Request } from "express"

/**
 * Static bearer-token check: callers must present the token configured in
 * PDF_RENDERER_AUTH_TOKEN. When the token is unset, requests are allowed for
 * local development, but production refuses to serve unauthenticated.
 */
@Injectable()
export class AuthTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expectedToken = process.env.PDF_RENDERER_AUTH_TOKEN
    if (!expectedToken) {
      if (process.env.NODE_ENV === "production") {
        throw new InternalServerErrorException(
          "PDF_RENDERER_AUTH_TOKEN must be configured in production",
        )
      }
      return true
    }
    const request = context.switchToHttp().getRequest<Request>()
    const provided = Buffer.from(request.headers.authorization ?? "")
    const expected = Buffer.from(`Bearer ${expectedToken}`)
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      throw new UnauthorizedException("Invalid pdf-renderer bearer token")
    }
    return true
  }
}
