import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from "@nestjs/common"
import type { EndpointRequestWithOrganizationId } from "@/common/context/request.interface"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"

/**
 * Validates the organization id route param and stores it on the request.
 * Authorization itself is enforced by CheckPermissionGuard (RBAC).
 */
@Injectable()
export class OrganizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest() as EndpointRequestWithOrganizationId & {
      params: { organizationId: string }
    }

    const organizationId = request.params.organizationId
    if (!organizationId || organizationId === ":organizationId") {
      throw new BadRequestException(AUTH_ERRORS.NO_ORGANIZATION_ID)
    }

    request.organizationId = organizationId

    return true
  }
}
