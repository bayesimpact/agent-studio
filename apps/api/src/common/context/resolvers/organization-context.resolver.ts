import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { UserMembershipService } from "@/domains/organizations/user-membership.service"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type { EndpointRequestWithUserMembership } from "../request.interface"

@Injectable()
export class OrganizationContextResolver implements ContextResolver {
  readonly resource = "organization" as const

  constructor(private readonly userMembershipService: UserMembershipService) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { organizationId?: string }
    }
    const organizationId = requestWithParams.params?.organizationId
    if (!organizationId || organizationId === ":organizationId") {
      throw new BadRequestException(AUTH_ERRORS.NO_ORGANIZATION_ID)
    }

    const userMembership = await this.userMembershipService.findUserMembership({
      userId: request.user.id,
      organizationId,
    })
    if (!userMembership) {
      throw new UnauthorizedException(AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    }

    const requestWithMembership = request as EndpointRequestWithUserMembership
    requestWithMembership.organizationId = organizationId
    requestWithMembership.userMembership = userMembership
  }
}
