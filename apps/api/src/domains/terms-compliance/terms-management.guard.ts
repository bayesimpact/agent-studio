import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common"
import type { EndpointRequest } from "@/common/context/request.interface"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { PermissionService } from "@/domains/rbac/permission.service"
import { TERMS_UPDATE_PERMISSION } from "@/domains/rbac/rbac.constants"

@Injectable()
export class TermsManagementGuard implements CanActivate {
  constructor(private readonly permissionService: PermissionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<EndpointRequest>()
    const user = request.user

    if (!user || !(await this.permissionService.hasGlobal(user.id, TERMS_UPDATE_PERMISSION))) {
      throw new ForbiddenException(AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    }
    return true
  }
}
