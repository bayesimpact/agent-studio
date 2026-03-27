import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type { EndpointRequestWithOrganizationMembership } from "../request.interface"

@Injectable()
export class OrganizationContextResolver implements ContextResolver {
  readonly resource = "organization" as const

  constructor(
    @InjectRepository(OrganizationMembership)
    private readonly organizationMembershipRepository: Repository<OrganizationMembership>,
  ) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { organizationId?: string }
    }
    const organizationId = requestWithParams.params?.organizationId
    if (!organizationId || organizationId === ":organizationId") {
      throw new BadRequestException(AUTH_ERRORS.NO_ORGANIZATION_ID)
    }

    const organizationMembership = await this.organizationMembershipRepository.findOne({
      where: {
        userId: request.user.id,
        organizationId,
      },
    })
    if (!organizationMembership) {
      throw new UnauthorizedException(AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    }

    const requestWithMembership = request as EndpointRequestWithOrganizationMembership
    requestWithMembership.organizationId = organizationId
    requestWithMembership.organizationMembership = organizationMembership
  }
}
