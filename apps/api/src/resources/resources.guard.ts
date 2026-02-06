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
import type { EndpointRequestWithResource } from "@/request.interface"
import type { Resource } from "./resource.entity"
import { ResourcePolicy } from "./resource.policy"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ResourcesService } from "./resources.service"

@Injectable()
export class ResourcesGuard implements CanActivate {
  constructor(
    readonly resourcesService: ResourcesService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // since ResourcesGuard is called after UserGuard, we can access the enhanced request object storing the user
    const request = context.switchToHttp().getRequest() as EndpointRequestWithResource & {
      params: { resourceId: string }
    }

    // fetch the resource from the database if resourceId is provided
    let resource: Resource | undefined
    const resourceId = request.params.resourceId

    // the caller didn't provide a resourceId and our route mechanism uses the :resourceId placeholder instead
    if (resourceId === ":resourceId") throw new NotFoundException()

    // ok, we have a resourceId (UPDATE, DELETE routes), fetch the resource from the database
    if (resourceId) {
      resource = (await this.resourcesService.findById(resourceId)) ?? undefined
      if (!resource) throw new NotFoundException()

      // enhance the request object with the resource
      request.resource = resource
    }

    const policy = new ResourcePolicy(request.userMembership, resource, request.project)

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
