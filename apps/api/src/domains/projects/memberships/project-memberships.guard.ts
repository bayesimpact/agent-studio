import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { Reflector } from "@nestjs/core"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { CHECK_POLICY_KEY, type PolicyHandler } from "@/common/policies/check-policy.decorator"
import type { EndpointRequestWithProjectMembership } from "@/request.interface"
import { requestToProjectPolicyContext } from "../helpers"
import type { ProjectMembership } from "./project-membership.entity"
import { ProjectMembershipPolicy } from "./project-membership.policy"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectMembershipsService } from "./project-memberships.service"

@Injectable()
export class ProjectMembershipsGuard implements CanActivate {
  constructor(
    readonly projectMembershipsService: ProjectMembershipsService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // since ProjectMembershipsGuard is called after ProjectsGuard, we can access the enhanced request object storing the project
    const request = context.switchToHttp().getRequest() as EndpointRequestWithProjectMembership & {
      params: { membershipId: string }
    }

    // fetch the project membership from the database if membershipId is provided
    let projectMembership: ProjectMembership | undefined
    const membershipId = request.params.membershipId

    // the caller didn't provide a membershipId and our route mechanism uses the :membershipId placeholder instead
    if (membershipId === ":membershipId") throw new NotFoundException()

    // ok, we have a membershipId (DELETE routes), fetch the membership from the database
    if (membershipId) {
      projectMembership = (await this.projectMembershipsService.findById(membershipId)) ?? undefined
      if (!projectMembership) throw new NotFoundException()

      // enhance the request object with the project membership
      request.projectMembership = projectMembership
    }

    const policy = new ProjectMembershipPolicy(
      requestToProjectPolicyContext(request),
      projectMembership,
    )

    const policyHandler = this.reflector.getAllAndOverride<PolicyHandler>(CHECK_POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!policyHandler || !policyHandler(policy)) {
      throw new ForbiddenException(AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    }

    return true
  }
}
