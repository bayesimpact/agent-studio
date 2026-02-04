import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { Reflector } from "@nestjs/core"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { CHECK_POLICY_KEY, type PolicyHandler } from "@/common/policies/check-policy.decorator"
import type { EndpointRequestWithUserMembership } from "@/request.interface"
import { ProjectPolicy } from "./project.policy"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectsService } from "./projects.service"

@Injectable()
export class ProjectsGuard implements CanActivate {
  constructor(
    readonly _projectsService: ProjectsService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // since ProjectsGuard is called after UserGuard, we can access the enhanced request object storing the user
    const request = context.switchToHttp().getRequest() as EndpointRequestWithUserMembership
    const policy = new ProjectPolicy(request.userMembership)

    console.log("ProjectsGuard canActivate", request.user.id, request.organizationId)

    const policyHandler = this.reflector.getAllAndOverride<PolicyHandler>(CHECK_POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!policyHandler || !policyHandler(policy)) {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED_PROTECTED_RESOURCE)
    }

    return true
  }
}
