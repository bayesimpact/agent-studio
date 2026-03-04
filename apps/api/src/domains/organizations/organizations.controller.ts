import { OrganizationsRoutes } from "@caseai-connect/api-contracts"
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import type { EndpointRequest } from "@/common/context/request.interface"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import { toDto } from "./organization.helpers"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { OrganizationsService } from "./organizations.service"
import { OrganizationsPolicyGuard } from "./organizations-policy.guard"

@UseGuards(JwtAuthGuard, UserGuard, OrganizationsPolicyGuard)
@Controller()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post(OrganizationsRoutes.createOrganization.path)
  @CheckPolicy((policy) => policy.canCreate())
  async createOrganization(
    @Req() request: EndpointRequest,
    @Body() body: typeof OrganizationsRoutes.createOrganization.request,
  ): Promise<typeof OrganizationsRoutes.createOrganization.response> {
    const user = request.user

    // Create organization with the user as owner
    const { organization, role } = await this.organizationsService.createOrganization(
      user.id,
      body.payload.name,
    )
    return { data: toDto({ organization, role }) }
  }
}
