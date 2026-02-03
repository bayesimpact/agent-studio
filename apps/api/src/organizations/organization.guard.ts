import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
import type { EndpointRequestWithUserMembership } from "@/request.interface"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { UserMembershipService } from "./user-membership.service"

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(readonly userMembershipService: UserMembershipService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // since OrganizationGuard must be called after UserGuard, we can access the enhanced request object storing the user
    const request = context.switchToHttp().getRequest() as EndpointRequestWithUserMembership & {
      params: { organizationId: string }
    }

    // Step 1: Get the required organization ID from the request parameters
    const organizationId = request.params.organizationId

    if (!organizationId || organizationId === ":organizationId") {
      throw new BadRequestException("Organization ID is required")
    }

    // Step 2: Get the user membership for the user and organization
    const userMembership = await this.userMembershipService.findUserMembership({
      userId: request.user.id,
      organizationId,
    })

    if (!userMembership) {
      throw new UnauthorizedException("User is not a member of the organization")
    }

    // Step 3: Store the user membership and organization ID in the request object
    request.userMembership = userMembership
    request.organizationId = organizationId

    return true
  }
}
